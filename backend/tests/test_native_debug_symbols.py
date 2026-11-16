"""The gate that decides whether a bundle is missing symbols it could have carried.

History worth keeping, because it is three attempts at one warning:

* #418 added `debugSymbolLevel = "SYMBOL_TABLE"` and closed. Codes 10, 11 and 12 shipped
  without symbols anyway.
* #451 found the missing NDK — AGP needs llvm-strip and only *warns* when it cannot find it —
  resolved the runner's NDK and added this check. The next release failed the check: the NDK
  was found, the strip task ran clean, and the bundle still had no symbols.
* #455 read the libraries themselves. All six come from dependencies and all six arrive
  stripped: `.dynsym` only, no `.symtab`. There is nothing to extract, so Play's warning
  cannot be cleared, and a gate that demands the impossible blocks every release.

Hence the shape of the check under test: ask a library whether it has a symbol table before
demanding a symbol file for it. Bundles are built by hand with real ELF objects, because the
question is now about their contents and a fake `.so` cannot answer it.

Second half, the one that lasts: the wiring in android-release.yml, because a check nobody
runs is a comment.
"""
import importlib.util
import struct
import zipfile
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check_native_debug_symbols.py"
WORKFLOW = ROOT / ".github" / "workflows" / "android-release.yml"

# The six libraries the 1.0.4 bundle carried, none of them ours: ML Kit's barcode scanner,
# Sentry, CameraX and the graphics path helper.
REAL_LIBRARIES = (
    "libandroidx.graphics.path.so",
    "libbarhopper_v3.so",
    "libimage_processing_util_jni.so",
    "libsentry-android.so",
    "libsentry.so",
    "libsurface_util_jni.so",
)
ABIS = ("arm64-v8a", "x86_64")

SYMBOLS_PREFIX = "BUNDLE-METADATA/com.android.tools.build.debugsymbols/"


# ── Building ELF objects to be read ──────────────────────────────────────────────────────
def elf(*section_names: str) -> bytes:
    """A minimal but genuinely parseable ELF64 object carrying exactly these sections.

    Written by hand rather than with a library so the test has no build-time dependency on an
    NDK or on pyelftools: the thing under test parses section headers, so the fixture has to
    produce real ones.
    """
    names = ("",) + section_names + (".shstrtab",)

    # The section-header string table: every name, NUL-terminated, with each one's offset.
    strtab = bytearray()
    offsets = []
    for name in names:
        offsets.append(len(strtab))
        strtab += name.encode() + b"\0"

    header_size, entry_size = 64, 64
    count = len(names)
    sh_off = header_size
    strtab_off = sh_off + count * entry_size

    header = bytearray(header_size)
    header[0:4] = b"\x7fELF"
    header[4] = 2          # 64-bit
    header[5] = 1          # little endian
    header[6] = 1          # ELF version
    struct.pack_into("<H", header, 0x10, 3)        # e_type: shared object
    struct.pack_into("<H", header, 0x12, 0xB7)     # e_machine: AArch64
    struct.pack_into("<I", header, 0x14, 1)        # e_version
    struct.pack_into("<Q", header, 0x28, sh_off)   # e_shoff
    struct.pack_into("<H", header, 0x34, header_size)
    struct.pack_into("<H", header, 0x3A, entry_size)
    struct.pack_into("<H", header, 0x3C, count)    # e_shnum
    struct.pack_into("<H", header, 0x3E, count - 1)  # e_shstrndx: .shstrtab is last

    headers = bytearray()
    for index, name in enumerate(names):
        entry = bytearray(entry_size)
        struct.pack_into("<I", entry, 0x00, offsets[index])  # sh_name
        struct.pack_into("<I", entry, 0x04, 0 if index == 0 else 1)  # SHT_NULL / SHT_PROGBITS
        if name == ".shstrtab":
            struct.pack_into("<Q", entry, 0x18, strtab_off)  # sh_offset
            struct.pack_into("<Q", entry, 0x20, len(strtab))  # sh_size
        headers += entry

    return bytes(header + headers + strtab)


STRIPPED = elf(".dynsym", ".dynstr", ".text", ".rodata")
"""What a vendor publishes: enough to link and run, nothing to symbolise."""

UNSTRIPPED = elf(".dynsym", ".dynstr", ".text", ".symtab", ".strtab")
"""What a library built without stripping looks like, and what ours would look like."""


def _load():
    spec = importlib.util.spec_from_file_location("check_native_debug_symbols", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _bundle(
    path: Path,
    libraries=REAL_LIBRARIES,
    symbols=REAL_LIBRARIES,
    suffix=".sym",
    content=UNSTRIPPED,
) -> Path:
    """An .aab-shaped zip: libraries under base/lib/<abi>/, symbols under BUNDLE-METADATA."""
    with zipfile.ZipFile(path, "w") as bundle:
        bundle.writestr("BundleConfig.pb", b"")
        bundle.writestr("base/manifest/AndroidManifest.xml", b"")
        for abi in ABIS:
            for library in libraries:
                body = content(library) if callable(content) else content
                bundle.writestr(f"base/lib/{abi}/{library}", body)
            for library in symbols:
                bundle.writestr(f"{SYMBOLS_PREFIX}{abi}/{library}{suffix}", b"symbols")
    return path


# ── The ELF reader, which the whole decision now rests on ────────────────────────────────
def test_a_stripped_object_has_no_symbol_table():
    assert ".symtab" not in _load().elf_sections(STRIPPED)
    assert ".dynsym" in _load().elf_sections(STRIPPED)


def test_an_unstripped_object_has_one():
    assert ".symtab" in _load().elf_sections(UNSTRIPPED)


def test_something_that_is_not_an_elf_is_not_guessed_about():
    """A fake .so must not be read as "has symbols" nor as "vendor-stripped by choice"."""
    assert _load().elf_sections(b"\x7fELF-not-really") == []
    assert _load().elf_sections(b"") == []
    assert _load().elf_sections(b"MZ\x90\x00this is a windows dll") == []


# ── The check ────────────────────────────────────────────────────────────────────────────
def test_a_bundle_with_symbols_for_every_library_passes(tmp_path):
    assert _load().main(str(_bundle(tmp_path / "ok.aab"))) == 0


def test_a_bundle_whose_libraries_could_be_symbolised_but_were_not_is_rejected(tmp_path):
    """The #451 case: symbol tables present upstream, nothing extracted."""
    assert _load().main(str(_bundle(tmp_path / "none.aab", symbols=()))) == 1


def test_one_library_without_symbols_is_rejected(tmp_path):
    """AGP writes one file per library it processes, so a gap means it skipped that one."""
    assert _load().main(
        str(_bundle(tmp_path / "gap.aab", symbols=REAL_LIBRARIES[:-1]))
    ) == 1


def test_full_symbol_level_is_accepted_too(tmp_path):
    """debugSymbolLevel = FULL writes .dbg instead of .sym; both are symbols."""
    assert _load().main(str(_bundle(tmp_path / "full.aab", suffix=".dbg"))) == 0


def test_a_bundle_whose_libraries_are_all_vendor_stripped_passes(tmp_path):
    """1.0.4, read for real: six stripped libraries, no symbols, and nothing anyone can do.

    This is the one that was wrong before #455 — it failed the release for an impossibility.
    """
    assert _load().main(
        str(_bundle(tmp_path / "stripped.aab", symbols=(), content=STRIPPED))
    ) == 0


def test_a_stripped_bundle_says_so_and_does_not_blame_the_toolchain(tmp_path, capsys):
    _load().main(str(_bundle(tmp_path / "stripped.aab", symbols=(), content=STRIPPED)))
    out = capsys.readouterr().out
    assert "#455" in out
    assert "stripped" in out.lower()
    assert "libbarhopper_v3.so" in out
    # Naming the NDK here would send the next person after a toolchain that is present and
    # working. That was the whole mistake.
    assert "NDK" not in out


def test_one_library_with_symbols_among_stripped_ones_is_still_demanded(tmp_path):
    """The case the gate exists for: a dependency that *does* ship symbols, skipped silently."""
    def content(library):
        return UNSTRIPPED if library == "libsentry.so" else STRIPPED

    assert _load().main(
        str(_bundle(tmp_path / "mixed.aab", symbols=(), content=content))
    ) == 1


def test_the_stripped_ones_are_not_demanded_of_in_a_mixed_bundle(tmp_path, capsys):
    def content(library):
        return UNSTRIPPED if library == "libsentry.so" else STRIPPED

    _load().main(str(_bundle(tmp_path / "mixed.aab", symbols=(), content=content)))
    out = capsys.readouterr().out
    assert "libsentry.so" in out
    for spared in ("libbarhopper_v3.so", "libsurface_util_jni.so"):
        assert spared not in out, f"{spared} is vendor-stripped and must not be demanded of"


def test_a_mixed_bundle_passes_once_the_symbolisable_one_is_covered(tmp_path, capsys):
    def content(library):
        return UNSTRIPPED if library == "libsentry.so" else STRIPPED

    assert _load().main(
        str(_bundle(tmp_path / "mixed-ok.aab", symbols=("libsentry.so",), content=content))
    ) == 0
    out = capsys.readouterr().out
    # It still reports the five it cannot do anything about, rather than claiming all is well.
    assert "vendor-stripped" in out
    assert "#455" in out


def test_a_bundle_with_no_native_code_passes(tmp_path):
    path = tmp_path / "pure.aab"
    with zipfile.ZipFile(path, "w") as bundle:
        bundle.writestr("BundleConfig.pb", b"")
        bundle.writestr("base/dex/classes.dex", b"dex")
    assert _load().main(str(path)) == 0


def test_a_so_outside_a_lib_folder_is_not_a_packaged_library(tmp_path):
    """Something shipped as an asset is not loaded by the linker and carries no frames."""
    path = tmp_path / "asset.aab"
    with zipfile.ZipFile(path, "w") as bundle:
        bundle.writestr("BundleConfig.pb", b"")
        bundle.writestr("base/assets/models/libmodel.so", UNSTRIPPED)
    assert _load().main(str(path)) == 0


def test_the_message_names_the_missing_toolchain(tmp_path, capsys):
    """When symbols *could* have been extracted, the message has to point somewhere useful."""
    _load().main(str(_bundle(tmp_path / "none.aab", symbols=())))
    out = capsys.readouterr().out
    assert "NDK" in out
    assert "llvm-strip" in out
    assert "#451" in out


# ── The wiring, because a check nobody runs is a comment ─────────────────────────────────
def _release_steps() -> list[dict]:
    workflow = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    return workflow["jobs"]["bundle"]["steps"]


def _index_of(steps: list[dict], needle: str) -> int:
    for index, step in enumerate(steps):
        body = " ".join(
            str(step.get(key, "")) for key in ("name", "run", "uses")
        )
        if needle in body:
            return index
    raise AssertionError(f"no step mentioning {needle!r} in {WORKFLOW.name}")


def test_the_release_workflow_runs_the_check_before_it_uploads_to_play():
    """Play is the one upload that cannot be taken back."""
    steps = _release_steps()
    assert _index_of(steps, "check_native_debug_symbols.py") < _index_of(
        steps, "upload-google-play"
    )


def test_the_check_runs_after_the_artifact_so_a_failure_leaves_a_bundle_to_open():
    """#455 was diagnosed by opening the 1.0.4 artifact; the failing run had none to open."""
    steps = _release_steps()
    assert _index_of(steps, "check_native_debug_symbols.py") > _index_of(
        steps, "upload-artifact"
    )


def test_the_ndk_is_resolved_before_the_build():
    steps = _release_steps()
    assert _index_of(steps, "ANDROID_NDK_LATEST_HOME") < _index_of(steps, "bundleRelease")


def test_the_resolved_ndk_reaches_gradle():
    steps = _release_steps()
    build = steps[_index_of(steps, "bundleRelease")]
    assert "NDK_VERSION" in build["run"]


def test_a_runner_without_an_ndk_fails_the_build():
    steps = _release_steps()
    resolve = steps[_index_of(steps, "ANDROID_NDK_LATEST_HOME")]
    assert "exit 1" in resolve["run"]


def test_the_build_script_accepts_the_version_the_workflow_passes():
    """The -P name in the workflow and the property the build file reads have to agree."""
    build_file = (ROOT / "android" / "app" / "build.gradle.kts").read_text(encoding="utf-8")
    assert 'findProperty("NDK_VERSION")' in build_file
    assert "ndkVersion" in build_file
