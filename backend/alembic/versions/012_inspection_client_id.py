"""inspection client_id for safe offline retries

Adds inspections.client_id: an id the app generates when it records a visit without a
connection. A retry carries the same value, and the create endpoint returns the stored
inspection instead of writing a second one. Unique per hive, so two hives can never
collide and existing rows (NULL) stay untouched — NULL is not equal to NULL in SQL, so
any number of old rows keeps working.

Revision ID: 012
Revises: 011
Create Date: 2026-10-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # batch_alter_table, not a plain ALTER: SQLite (dev and tests) cannot alter
    # constraints in place and needs alembic's copy-and-move; PostgreSQL
    # (staging and production) runs the ordinary ALTER underneath.
    with op.batch_alter_table("inspections") as batch:
        batch.add_column(sa.Column("client_id", sa.String(length=64), nullable=True))
        batch.create_index("ix_inspections_client_id", ["client_id"])
        batch.create_unique_constraint(
            "uq_inspection_hive_client_id", ["hive_id", "client_id"]
        )


def downgrade() -> None:
    with op.batch_alter_table("inspections") as batch:
        batch.drop_constraint("uq_inspection_hive_client_id", type_="unique")
        batch.drop_index("ix_inspections_client_id")
        batch.drop_column("client_id")
