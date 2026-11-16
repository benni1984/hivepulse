"""Refuse to ship an app bundle whose native libraries have no debug symbols.

Play reports this after the upload, as a warning on the release:

    "This App Bundle contains native code, and you've not uploaded debug symbols."

A crash or an ANR inside one of those libraries then arrives as bare addresses. The native
code is not ours -- ML Kit's barcode scanner, Sentry and CameraX ship it -- but their frames
land in our crash reports all the same. Our own Kotlin traces are unaffected: the R8 mapping
file travels inside the `.aab`.

`android/app/build.gradle.kts` has asked for the symbols since version code 10, and version
codes 10, 11 and 12 shipped without them anyway (#451). AGP needs the NDK's llvm-strip and
llvm-objcopy to extract them, no NDK was declared, and the missing toolchain is a WARNING in
the Gradle log, not an error:

    Unable to strip the following libraries, packaging them as they are: ...

So the setting was right, the effect never arrived, and nothing looked. That is what this
script is for, and why it runs before the upload rather than after it.

Every packaged library must have a symbol file. AGP writes one per library it processes, so a
missing one means it skipped that library -- the same silent degradation one library at a
time. If a vendor ever ships something from which no symbol table can be extracted, this will
say which, and that is the point at which somebody decides, rather than finding out from a
console warning three releases later.

Usage:
    python scripts/check_native_debug_symbols.py path/to/app-release.aab
"""
import sys
import zipfile

# Where AGP puts them inside the bundle, one file per library per ABI.
SYMBOLS_PREFIX = "BUNDLE-METADATA/com.android.tools.build.debugsymbols/"


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


def main(path: str) -> int:
    with zipfile.ZipFile(path) as bundle:
        names = bundle.namelist()

    libraries = native_libraries(names)
    symbols = symbol_files(names)

    if not libraries:
        # No native code at all is a perfectly good bundle, and Play says nothing about it.
        print(f"{path} carries no native libraries — nothing to symbolise.")
        return 0

    if not symbols:
        print(
            f"None of the {len(libraries)} native libraries in {path} has debug symbols.\n"
            f"Nothing was written under {SYMBOLS_PREFIX}, which is what Play reports as\n"
            '"contains native code, and you\'ve not uploaded debug symbols".\n\n'
            "The usual cause is a missing NDK: AGP needs llvm-strip and llvm-objcopy to\n"
            'extract the tables and only warns ("Unable to strip the following libraries")\n'
            "when it cannot find them. See android/app/build.gradle.kts and #451."
        )
        return 1

    missing = sorted(libraries - symbols)
    if missing:
        for abi, library in missing:
            print(f"  {abi}/{library}: packaged without a symbol file")
        print(
            f"\n{len(missing)} of {len(libraries)} native libraries have no debug symbols.\n"
            "AGP writes one file per library it processes, so it skipped these."
        )
        return 1

    abis = sorted({abi for abi, _ in libraries})
    print(
        f"All {len(libraries)} native libraries carry debug symbols "
        f"({len(abis)} ABIs: {', '.join(abis)})."
    )
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
