"""add reminder preferences and push tokens to users

Revision ID: 007
Revises: 006
Create Date: 2026-05-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("reminder_enabled",       sa.Boolean(), nullable=False, server_default="1"))
    op.add_column("users", sa.Column("reminder_interval_days", sa.Integer(), nullable=False, server_default="7"))
    op.add_column("users", sa.Column("reminder_season_start",  sa.Integer(), nullable=False, server_default="4"))
    op.add_column("users", sa.Column("reminder_season_end",    sa.Integer(), nullable=False, server_default="8"))
    op.add_column("users", sa.Column("push_token_apns",        sa.String(),  nullable=True))
    op.add_column("users", sa.Column("push_token_fcm",         sa.String(),  nullable=True))


def downgrade() -> None:
    op.drop_column("users", "push_token_fcm")
    op.drop_column("users", "push_token_apns")
    op.drop_column("users", "reminder_season_end")
    op.drop_column("users", "reminder_season_start")
    op.drop_column("users", "reminder_interval_days")
    op.drop_column("users", "reminder_enabled")
