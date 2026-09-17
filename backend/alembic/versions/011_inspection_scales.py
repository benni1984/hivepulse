"""varroa level and three-step colony strength

Adds inspections.varroa_level (0 none, 1 low, 2 medium, 3 high) and backfills it
from varroa_count, which is kept. Rescales population_strength from 1–5 to 1–3.
Thresholds mirror app.utils.scales.

Revision ID: 011
Revises: 010
Create Date: 2026-09-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("inspections", sa.Column("varroa_level", sa.Integer(), nullable=True))
    op.execute(
        """
        UPDATE inspections SET varroa_level = CASE
            WHEN varroa_count IS NULL THEN NULL
            WHEN varroa_count <= 0 THEN 0
            WHEN varroa_count <= 2 THEN 1
            WHEN varroa_count <= 5 THEN 2
            ELSE 3
        END
        """
    )
    op.execute(
        """
        UPDATE inspections SET population_strength = CASE
            WHEN population_strength <= 2 THEN 1
            WHEN population_strength = 3 THEN 2
            ELSE 3
        END
        WHERE population_strength IS NOT NULL
        """
    )


def downgrade() -> None:
    # The 1–5 strength values cannot be restored exactly; 1/2/3 map back to 1/3/5.
    op.execute(
        """
        UPDATE inspections SET population_strength = CASE
            WHEN population_strength = 1 THEN 1
            WHEN population_strength = 2 THEN 3
            ELSE 5
        END
        WHERE population_strength IS NOT NULL
        """
    )
    op.drop_column("inspections", "varroa_level")
