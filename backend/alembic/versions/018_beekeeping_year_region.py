"""Where the beekeeper keeps bees: country, postal code and the position it was looked up to.

Revision ID: 018
Revises: 017
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("country", sa.String(length=2), nullable=True))
    op.add_column("users", sa.Column("postal_code", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("region_latitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("region_longitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("region_adjust_days", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "region_adjust_days")
    op.drop_column("users", "region_longitude")
    op.drop_column("users", "region_latitude")
    op.drop_column("users", "postal_code")
    op.drop_column("users", "country")
