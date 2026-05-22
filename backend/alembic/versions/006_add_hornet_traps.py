"""add hornet trap tables

Revision ID: 006
Revises: 005
Create Date: 2026-05-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hornet_traps",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("access_code", sa.String(8), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("owner_name", sa.String(100), nullable=True),
        sa.Column(
            "user_id",
            sa.String,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_hornet_traps_access_code", "hornet_traps", ["access_code"], unique=True)
    op.create_index("ix_hornet_traps_user_id", "hornet_traps", ["user_id"])

    op.create_table(
        "hornet_trap_catches",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "trap_id",
            sa.String,
            sa.ForeignKey("hornet_traps.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("caught_on", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_hornet_trap_catches_trap_id", "hornet_trap_catches", ["trap_id"])


def downgrade() -> None:
    op.drop_index("ix_hornet_trap_catches_trap_id", table_name="hornet_trap_catches")
    op.drop_table("hornet_trap_catches")
    op.drop_index("ix_hornet_traps_user_id", table_name="hornet_traps")
    op.drop_index("ix_hornet_traps_access_code", table_name="hornet_traps")
    op.drop_table("hornet_traps")
