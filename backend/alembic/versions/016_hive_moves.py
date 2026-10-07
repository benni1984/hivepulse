"""Moving hives between apiaries, with the history.

Revision ID: 016
Revises: 015
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hive_moves",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("hive_id", sa.String(), sa.ForeignKey("hives.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_apiary_id", sa.String(), sa.ForeignKey("apiaries.id", ondelete="SET NULL"), nullable=True),
        sa.Column("to_apiary_id", sa.String(), sa.ForeignKey("apiaries.id", ondelete="SET NULL"), nullable=True),
        sa.Column("moved_on", sa.Date(), nullable=False),
        sa.Column("forage", sa.String(length=100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        # Both ends are copied at the time of the move, so the history stays true when an apiary is
        # renamed, shifted or deleted afterwards.
        sa.Column("from_name", sa.String(), nullable=False),
        sa.Column("from_latitude", sa.Float(), nullable=True),
        sa.Column("from_longitude", sa.Float(), nullable=True),
        sa.Column("to_name", sa.String(), nullable=False),
        sa.Column("to_latitude", sa.Float(), nullable=True),
        sa.Column("to_longitude", sa.Float(), nullable=True),
        sa.Column("created_by_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_hive_moves_hive_id", "hive_moves", ["hive_id"])
    op.create_index("ix_hive_moves_moved_on", "hive_moves", ["moved_on"])


def downgrade() -> None:
    op.drop_index("ix_hive_moves_moved_on", table_name="hive_moves")
    op.drop_index("ix_hive_moves_hive_id", table_name="hive_moves")
    op.drop_table("hive_moves")
