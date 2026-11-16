"""Refuse to ship an app bundle that drops debug symbols it could have carried.

Play reports this after the upload, as a warning on the release:

    "This App Bundle contains native code, and you've not uploaded debug symbols."

A crash or an ANR inside one of those libraries then arrives as bare addresses. Our own Kotlin
traces are a different matter and are unaffected here: the R8 mapping file travels inside the
`.aab` (what Sentry does with them is #452).

For *this* app that warning cannot be cleared, and the check knows it. The app builds no native
code of its own; all six libraries come from dependencies, and their vendors publish them
stripped -- ML Kit's `libbarhopper_v3.so`, Sentry's `libsentry.so`, AndroidX's graphics-path and
CameraX's two JNI helpers each carry `.dynsym` (what the dynamic linker needs) and no `.symtab`.
`debugSymbolLevel = "SYMBOL_TABLE"` lifts `.symtab` into the bundle, so where there is no
`.symtab` nothing can be lifted, with or without an NDK. Verified against the bundle Play
received for 1.0.4: 24 libraries, not one with a symbol table (#455).

Which is why this script asks each library whether it has anything to give before demanding it:

* a library with a `.symtab` and no symbol file is a failure -- that is AGP silently skipping it,
  which is what #451 was, and the three things that cause it are a missing NDK (AGP only *warns*
  when it cannot find llvm-strip), a `debugSymbolLevel` that got dropped from the release block,
  and a bundle assembled from stale task output;
* a library without one is reported and passed over, because no setting and no toolchain can
  produce symbols that do not exist upstream.

So the day we add our own native code, or a vendor starts publishing unstripped libraries, the
symbols either arrive or this fails. Until then it states what the bundle contains and lets the
release through.

Usage:
    python scripts/check_native_debug_symbols.py path/to/app-release.aab
"""
import sys
import zipfile

# Where AGP puts them inside the bundle, one file per library per ABI.
SYMBOLS_PREFIX = "BUNDLE-METADATA/com.android.tools.build.debugsymbols/"

# The section that holds function names for symbolication. `.dynsym` is not a substitute: it
# lists only what other objects link against, which is why a stripped library still loads.
SYMBOL_TABLE_SECTION = ".symtab"


def elf_sections(blob: bytes) -> list[str]:
    """Section names of an ELF object, or [] if this is not a readable ELF.

    Read from the section headers directly: no NDK, no readelf, no Android SDK, so this works
    on any machine that can open the bundle.
    """
    if blob[:4] != b"\x7fELF":
        return []
    is_64 = blob[4] == 2
    little = blob[5] == 1
    order = "little" if little else "big"

    def num(offset: int, size: int) -> int:
        return int.from_bytes(blob[offset : offset + size], order)

    try:
        if is_64:
            sh_off, sh_entsize, sh_num, sh_strndx = (
                num(0x28, 8), num(0x3A, 2), num(0x3C, 2), num(0x3E, 2),
            )
            name_field = 0x18  # sh_offset within a 64-bit section header
            name_size = 8
        else:
            sh_off, sh_entsize, sh_num, sh_strndx = (
                num(0x20, 4), num(0x2E, 2), num(0x30, 2), num(0x32, 2),
            )
            name_field = 0x10  # sh_offset within a 32-bit section header
            name_size = 4

        if not sh_off or not sh_num or sh_strndx >= sh_num:
            return []

        # The section-header string table holds every other section's name.
        strings_at = num(sh_off + sh_strndx * sh_entsize + name_field, name_size)

        names = []
        for index in range(sh_num):
            offset = strings_at + num(sh_off + index * sh_entsize, 4)
            names.append(blob[offset : blob.index(b"\0", offset)].decode("utf-8", "replace"))
        return names
    except (IndexError, ValueError):
        # A truncated or unusual object is not something to guess about. Treating it as
        # unreadable means it is reported, not silently demanded of or excused.
        return []


def native_libraries(names: list[str]) -> set[tuple[str, str]]:
    """(abi, filename) for every .so the bundle carries, from any module."""
    found = set()
    for name in names:
        if not name.endswith(".so"):
            continue
        # <module>/lib/<abi>/<name>.so — "base/lib/arm64-v8a/libsentry.so"
        parts = name.split("/")
        if len(parts) >= 3 and parts[-3] == "lib":
            found.add((parts[-2], parts[-1]))
    return found


def symbol_files(names: list[str]) -> set[tuple[str, str]]:
    """(abi, library filename) for every symbol file, with the .sym suffix removed."""
    found = set()
    for name in names:
        if not name.startswith(SYMBOLS_PREFIX):
            continue
        parts = name[len(SYMBOLS_PREFIX):].split("/")
        if len(parts) != 2 or not parts[1]:
            continue
        abi, symbol = parts
        # AGP writes libfoo.so.sym (SYMBOL_TABLE) or libfoo.so.dbg (FULL).
        for suffix in (".sym", ".dbg"):
            if symbol.endswith(suffix):
                found.add((abi, symbol[: -len(suffix)]))
                break
    return found


def libraries_with_symbol_tables(bundle: zipfile.ZipFile) -> set[tuple[str, str]]:
    """The subset of packaged libraries from which a symbol table could be extracted."""
    found = set()
    for name in bundle.namelist():
        if not name.endswith(".so"):
            continue
        parts = name.split("/")
        if len(parts) < 3 or parts[-3] != "lib":
            continue
        if SYMBOL_TABLE_SECTION in elf_sections(bundle.read(name)):
            found.add((parts[-2], parts[-1]))
    return found


def by_library(entries: set[tuple[str, str]]) -> list[str]:
    """One line per library naming its ABIs, rather than the same name once per ABI."""
    grouped: dict[str, list[str]] = {}
    for abi, library in entries:
        grouped.setdefault(library, []).append(abi)
    return [
        f"  {library} ({', '.join(sorted(abis))})"
        for library, abis in sorted(grouped.items())
    ]


def main(path: str) -> int:
    with zipfile.ZipFile(path) as bundle:
        names = bundle.namelist()
        libraries = native_libraries(names)
        if not libraries:
            # No native code at all is a perfectly good bundle, and Play says nothing about it.
            print(f"{path} carries no native libraries — nothing to symbolise.")
            return 0
        symbolisable = libraries_with_symbol_tables(bundle)

    symbols = symbol_files(names)
    stripped = libraries - symbolisable

    if not symbolisable:
        # Every library arrived stripped from its vendor. Play's warning is unavoidable and
        # this is not a reason to hold a release — see #455 for the evidence and the decision.
        print(
            f"{len(libraries)} native libraries, none of which carries a {SYMBOL_TABLE_SECTION}:\n"
            + "\n".join(by_library(stripped))
            + "\n\nAll of them arrived stripped from their vendors, so there is nothing for AGP to\n"
            "extract and Play's \"no debug symbols\" warning cannot be cleared (#455). Passing:\n"
            "a release must not wait for symbols that do not exist upstream."
        )
        return 0

    missing = sorted(symbolisable - symbols)
    if missing:
        for abi, library in missing:
            print(f"  {abi}/{library}: has a {SYMBOL_TABLE_SECTION} but was packaged without a symbol file")
        print(
            f"\n{len(missing)} of {len(symbolisable)} libraries that could be symbolised were not.\n"
            "AGP writes one file per library it processes, so it skipped these. The usual cause is\n"
            "a missing NDK: it needs llvm-strip and llvm-objcopy to extract the tables and only\n"
            'warns ("Unable to strip the following libraries") when it cannot find them. Check the\n'
            "NDK step in .github/workflows/android-release.yml, the release block in\n"
            "android/app/build.gradle.kts, and #451."
        )
        return 1

    abis = sorted({abi for abi, _ in symbolisable})
    print(
        f"All {len(symbolisable)} native libraries that carry a {SYMBOL_TABLE_SECTION} have debug "
        f"symbols ({len(abis)} ABIs: {', '.join(abis)})."
    )
    if stripped:
        print(
            f"{len(stripped)} further libraries are vendor-stripped and cannot be symbolised "
            "(#455):\n" + "\n".join(by_library(stripped))
        )
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
