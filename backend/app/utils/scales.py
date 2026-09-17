"""Inspection rating scales shared by the API, the migration and the aggregations.

Varroa is recorded as a level instead of a mite count, and colony strength as a
three-step scale, so beekeepers pick a word instead of counting.
"""
from typing import Optional

# varroa_level: 0 none, 1 low, 2 medium, 3 high
VARROA_LEVEL_MAX = 3
# population_strength: 1 weak, 2 medium, 3 strong
POPULATION_STRENGTH_MAX = 3


def varroa_level_from_count(count: Optional[int]) -> Optional[int]:
    """Map a legacy mite count onto the 0–3 varroa level.

    Thresholds match the heatmap bands the counts were shown in before
    (below 2 low, 2–5 medium, above 5 high), with an explicit zero for "none".
    Kept in step with migration 011.
    """
    if count is None:
        return None
    if count <= 0:
        return 0
    if count <= 2:
        return 1
    if count <= 5:
        return 2
    return 3


def population_strength_from_legacy(value: Optional[int]) -> Optional[int]:
    """Map the retired 1–5 strength scale onto 1–3 (1–2 weak, 3 medium, 4–5 strong)."""
    if value is None:
        return None
    if value <= 2:
        return 1
    if value == 3:
        return 2
    return 3
