"""The check that would have caught three releases shipping without debug symbols.

`android/app/build.gradle.kts` asked for native debug symbols from version code 10 on, and
codes 10, 11 and 12 all went to Play without them: AGP needs the NDK to extract them and only
prints a warning when it cannot find one. So the setting was right, the effect never arrived,
and nothing between the two ever looked (#451).

Two halves here, and the second is the one that lasts: the script itself against bundles built
by hand, and the wiring in android-release.yml, because a check nobody runs is a comment.
"""
import importlib.util
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


def _load():
    spec = importlib.util.spec_from_file_location("check_native_debug_symbols", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _bundle(path: Path, libraries=REAL_LIBRARIES, symbols=REAL_LIBRARIES, suffix=".sym") -> Path:
    """An .aab-shaped zip: libraries under base/lib/<abi>/, symbols under BUNDLE-METADATA."""
    with zipfile.ZipFile(path, "w") as bundle:
        bundle.writestr("BundleConfig.pb", b"")
        bundle.writestr("base/manifest/AndroidManifest.xml", b"")
        for abi in ABIS:
            for library in libraries:
                bundle.writestr(f"base/lib/{abi}/{library}", b"\x7fELF-not-really")
            for library in symbols:
                bundle.writestr(
                    "BUNDLE-METADATA/com.android.tools.build.debugsymbols/"
                    f"{abi}/{library}{suffix}",
                    b"symbols",
                )
    return path


def test_a_bundle_with_symbols_for_every_library_passes(tmp_path):
    assert _load().main(str(_bundle(tmp_path / "ok.aab"))) == 0


def test_the_1_0_4_bundle_is_rejected(tmp_path):
    """No BUNDLE-METADATA at all — exactly what codes 10, 11 and 12 shipped."""
    assert _load().main(str(_bundle(tmp_path / "none.aab", symbols=()))) == 1


def test_one_library_without_symbols_is_rejected(tmp_path):
    """AGP writes one file per library it processes, so a gap means it skipped that one."""
    partial = _bundle(tmp_path / "partial.aab", symbols=REAL_LIBRARIES[:-1])

    assert _load().main(str(partial)) == 1


def test_full_symbol_level_is_accepted_too(tmp_path):
    """debugSymbolLevel FULL writes .so.dbg instead of .so.sym; both are symbols."""
    assert _load().main(str(_bundle(tmp_path / "full.aab", suffix=".dbg"))) == 0


def test_a_bundle_with_no_native_code_passes(tmp_path):
    """Play says nothing about a bundle without native code, so neither does this."""
    plain = tmp_path / "plain.aab"
    with zipfile.ZipFile(plain, "w") as bundle:
        bundle.writestr("base/manifest/AndroidManifest.xml", b"")
        bundle.writestr("base/dex/classes.dex", b"")

    assert _load().main(str(plain)) == 0


def test_a_so_outside_a_lib_folder_is_not_a_packaged_library(tmp_path):
    """Only <module>/lib/<abi>/*.so is loaded at runtime; an asset named .so is not."""
    odd = tmp_path / "odd.aab"
    with zipfile.ZipFile(odd, "w") as bundle:
        bundle.writestr("base/assets/notes.so", b"")

    assert _load().main(str(odd)) == 0


def test_the_message_names_the_missing_toolchain(tmp_path, capsys):
    """The failure has to point at the NDK, or the next person sets debugSymbolLevel again."""
    _load().main(str(_bundle(tmp_path / "none.aab", symbols=())))

    printed = capsys.readouterr().out
    assert "NDK" in printed
    assert "#451" in printed


# ── the wiring ────────────────────────────────────────────────────────────────

def _release_steps() -> list[dict]:
    workflow = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    return workflow["jobs"]["bundle"]["steps"]


def _index_of(steps: list[dict], needle: str) -> int:
    for position, step in enumerate(steps):
        where = (step.get("name") or "") + (step.get("run") or "") + (step.get("uses") or "")
        if needle in where:
            return position
    raise AssertionError(f"no step mentioning {needle!r} in android-release.yml")


def test_the_release_workflow_runs_the_check_before_it_uploads():
    steps = _release_steps()

    check = _index_of(steps, "check_native_debug_symbols.py")
    upload = _index_of(steps, "upload-artifact")
    play = _index_of(steps, "Upload to Play")

    assert check < upload < play, "the symbols are checked after the bundle has already gone"


def test_the_ndk_is_resolved_before_the_build():
    steps = _release_steps()

    assert _index_of(steps, "ANDROID_NDK_LATEST_HOME") < _index_of(steps, "bundleRelease"), (
        "resolving the NDK after the build leaves the build without it"
    )


def test_the_resolved_ndk_reaches_gradle():
    """The build script reads -PNDK_VERSION; without the flag the step is decoration."""
    build = _release_steps()[_index_of(_release_steps(), "bundleRelease")]

    assert "-PNDK_VERSION=" in build["run"]


def test_a_runner_without_an_ndk_fails_the_build():
    """Carrying on would produce exactly the bundle this whole file exists to prevent."""
    resolve = _release_steps()[_index_of(_release_steps(), "ANDROID_NDK_LATEST_HOME")]

    assert "exit 1" in resolve["run"]


def test_the_build_script_accepts_the_version_the_workflow_passes():
    gradle = (ROOT / "android" / "app" / "build.gradle.kts").read_text(encoding="utf-8")

    assert 'findProperty("NDK_VERSION")' in gradle
    # The environment fallback is what gives CI and the smoke test the same stripping without
    # each workflow having to remember the flag.
    assert "ANDROID_NDK_LATEST_HOME" in gradle
    assert 'debugSymbolLevel = "SYMBOL_TABLE"' in gradle
