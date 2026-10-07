"""Planned treatments: what is going to happen, for which hive or apiary, by when.

Revision ID: 017
Revises: 016
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "planned_treatments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("hive_id", sa.String(), sa.ForeignKey("hives.id", ondelete="CASCADE"), nullable=True),
        sa.Column("apiary_id", sa.String(), sa.ForeignKey("apiaries.id", ondelete="CASCADE"), nullable=True),
        sa.Column("product", sa.String(length=200), nullable=False),
        sa.Column("due_on", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("done_on", sa.Date(), nullable=True),
        sa.Column("created_by_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("(apiary_id IS NULL) <> (hive_id IS NULL)", name="ck_treatment_one_target"),
    )
    op.create_index("ix_planned_treatments_hive_id", "planned_treatments", ["hive_id"])
    op.create_index("ix_planned_treatments_apiary_id", "planned_treatments", ["apiary_id"])
    op.create_index("ix_planned_treatments_due_on", "planned_treatments", ["due_on"])


def downgrade() -> None:
    op.drop_index("ix_planned_treatments_due_on", table_name="planned_treatments")
    op.drop_index("ix_planned_treatments_apiary_id", table_name="planned_treatments")
    op.drop_index("ix_planned_treatments_hive_id", table_name="planned_treatments")
    op.drop_table("planned_treatments")
