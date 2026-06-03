"""add password_reset_tokens table

Revision ID: 008
Revises: 007
Create Date: 2026-06-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_tokens",
        sa.Column("id",         sa.String(),  primary_key=True),
        sa.Column("user_id",    sa.String(),  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token",      sa.String(),  nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at",    sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_password_reset_tokens_token", "password_reset_tokens", ["token"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_tokens_token", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
