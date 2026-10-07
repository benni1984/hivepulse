"""The screenshot workflow retakes only what went stale, so the staleness check has to be right.

scripts/check_screenshot_freshness.py hashes the files that decide what a screenshot shows. These tests
point it at a small throw-away repository instead of the real one.
"""
import importlib.util
import json
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "check_screenshot_freshness.py"


@pytest.fixture
def fresh(tmp_path, monkeypatch):
    spec = importlib.util.spec_from_file_location("check_screenshot_freshness", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    (tmp_path / "ios").mkdir()
    (tmp_path / "android").mkdir()
    (tmp_path / "web").mkdir()
    (tmp_path / "docs").mkdir()
    for name in ("ios", "android", "web"):
        (tmp_path / name / "screen.txt").write_text("v1", encoding="utf-8")

    monkeypatch.setattr(module, "REPO", tmp_path)
    monkeypatch.setattr(module, "MANIFEST", tmp_path / "docs" / "screenshot-manifest.json")
    monkeypatch.setattr(module, "WATCHED", {"ios": ["ios"], "android": ["android"], "web": ["web"]})
    monkeypatch.setattr(module, "PURPOSE", {"ios": "ios", "android": "android", "web": "web"})
    module.root = tmp_path
    return module


def test_nothing_is_recorded_so_every_set_counts_as_stale(fresh):
    assert fresh.stale_platforms() == ["ios", "android", "web"]


def test_after_capturing_nothing_is_stale(fresh):
    fresh.update()

    assert fresh.stale_platforms() == []


def test_a_changed_view_makes_only_its_platform_stale(fresh):
    fresh.update()
    (fresh.root / "android" / "screen.txt").write_text("v2", encoding="utf-8")

    assert fresh.stale_platforms() == ["android"]


def test_a_new_file_under_a_watched_path_makes_it_stale(fresh):
    fresh.update()
    (fresh.root / "web" / "new-page.txt").write_text("hello", encoding="utf-8")

    assert fresh.stale_platforms() == ["web"]


def test_recording_one_platform_leaves_the_others_stale(fresh):
    fresh.update(["ios"])

    assert fresh.stale_platforms() == ["android", "web"]
    recorded = json.loads(fresh.MANIFEST.read_text(encoding="utf-8"))
    assert list(recorded) == ["ios"]


def test_retaking_a_platform_clears_it_after_it_changed(fresh):
    fresh.update()
    (fresh.root / "ios" / "screen.txt").write_text("v2", encoding="utf-8")
    (fresh.root / "web" / "screen.txt").write_text("v2", encoding="utf-8")
    assert fresh.stale_platforms() == ["ios", "web"]

    fresh.update(["ios"])

    assert fresh.stale_platforms() == ["web"]


def test_list_stale_prints_and_writes_the_workflow_outputs(fresh, monkeypatch, tmp_path, capsys):
    fresh.update()
    (fresh.root / "ios" / "screen.txt").write_text("v2", encoding="utf-8")
    output = tmp_path / "github_output"
    monkeypatch.setenv("GITHUB_OUTPUT", str(output))
    capsys.readouterr()  # what update() printed

    assert fresh.list_stale() == 0

    assert capsys.readouterr().out.strip() == "ios"
    lines = output.read_text(encoding="utf-8").splitlines()
    assert "stale=ios" in lines
    assert "ios=true" in lines
    assert "android=false" in lines
    assert "web=false" in lines


def test_the_real_manifest_covers_every_watched_platform():
    """The workflow trusts these three names; a typo would silently skip a platform."""
    spec = importlib.util.spec_from_file_location("check_screenshot_freshness_real", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    assert sorted(module.WATCHED) == ["android", "ios", "web"]
    assert set(module.PURPOSE) == set(module.WATCHED)
