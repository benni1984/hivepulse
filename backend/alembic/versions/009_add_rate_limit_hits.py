"""add rate_limit_hits table

Revision ID: 009
Revises: 008
Create Date: 2026-07-08

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rate_limit_hits",
        sa.Column("id",         sa.String(),  primary_key=True),
        sa.Column("bucket_key", sa.String(),  nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_rate_limit_hits_bucket_key", "rate_limit_hits", ["bucket_key"])
    op.create_index("ix_rate_limit_hits_created_at", "rate_limit_hits", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_rate_limit_hits_created_at", table_name="rate_limit_hits")
    op.drop_index("ix_rate_limit_hits_bucket_key", table_name="rate_limit_hits")
    op.drop_table("rate_limit_hits")
