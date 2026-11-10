"""Two Swift types in one target must not share a name.

`xcodebuild` says `invalid redeclaration of 'X'` and refuses to build the test bundle — and the
only machine that can tell us is the macOS runner, about forty minutes after the push. It has
happened twice: a new `DayFormatTests.swift` while `HomeTests.swift` already held a
`DayFormatTests`, and on Android a `TreatmentDateTest.kt` next to the test in `HomeTests.kt`
that already covered the same ground. Both times the honest fix was not a new file but an
addition to the existing one, and both times a second's worth of reading would have said so.

Each target is its own Swift module, so `HivePulse`, `HivePulseTests` and `HivePulseUITests` are
checked separately: the same name in two different targets is legal and sometimes deliberate.
"""
import re
from pathlib import Path

IOS = Path(__file__).resolve().parents[2] / "ios"
TARGETS = ["HivePulse", "HivePulseTests", "HivePulseUITests"]

# A type declaration at the start of a line, with any access/final/@MainActor words in between.
# `extension` is deliberately absent: repeating one is how Swift is written.
DECL = re.compile(
    r"^(?:@\w+(?:\([^)]*\))?\s+)*"
    r"(?:public |internal |private |fileprivate |open |final |indirect )*"
    r"(class|struct|enum|actor|protocol) +([A-Za-z_]\w*)",
    re.MULTILINE,
)


def _declarations(target):
    """{name: [file:line, …]} for one target, nested declarations included.

    A nested type is namespaced by its parent and cannot collide with a top-level one, so this
    over-reports in theory. In practice this app nests almost nothing, and a check that reads a
    little too much is worth more than one that needs a brace parser to be trusted.
    """
    found = {}
    root = IOS / target
    for path in sorted(root.rglob("*.swift")):
        text = path.read_text(encoding="utf-8")
        for match in DECL.finditer(text):
            name = match.group(2)
            line = text[: match.start()].count("\n") + 1
            where = f"{path.relative_to(IOS).as_posix()}:{line}"
            found.setdefault(name, []).append(where)
    return found


def test_the_targets_are_where_this_test_thinks_they_are():
    for target in TARGETS:
        assert (IOS / target).is_dir(), f"ios/{target} is gone — this test is checking nothing"


def test_the_scan_finds_the_types_it_should():
    # A fixture check: if the regex silently stops matching, every assertion below passes.
    tests = _declarations("HivePulseTests")
    assert len(tests) > 30, f"only {len(tests)} types found in HivePulseTests — the regex broke"
    assert "DayFormatTests" in tests, "the day-format tests are named something else now"
    assert "HomeDTOTests" in tests


def test_no_two_types_in_one_target_share_a_name():
    collisions = []
    for target in TARGETS:
        for name, places in sorted(_declarations(target).items()):
            if len(places) > 1:
                collisions.append(f"{target}: {name} declared in {', '.join(places)}")
    assert not collisions, (
        "Swift refuses to build a target with two types of the same name, and only the macOS "
        "runner would say so:\n  " + "\n  ".join(collisions)
    )


def test_every_test_class_name_ends_in_tests():
    """Not a build error, but a class XCTest cannot find runs no assertions at all."""
    stragglers = []
    for target in ["HivePulseTests", "HivePulseUITests"]:
        for path in sorted((IOS / target).rglob("*.swift")):
            text = path.read_text(encoding="utf-8")
            for match in re.finditer(r"^(?:final )?class +(\w+) *: *XCTestCase", text, re.MULTILINE):
                name = match.group(1)
                if not name.endswith("Tests"):
                    line = text[: match.start()].count("\n") + 1
                    stragglers.append(f"{path.relative_to(IOS).as_posix()}:{line} {name}")
    assert not stragglers, "XCTestCase subclasses whose name does not end in Tests:\n  " + "\n  ".join(stragglers)
