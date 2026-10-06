"""Apple refresh token, kept so it can be revoked when the account is deleted.

Revision ID: 014
Revises: 013
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("apple_refresh_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("apple_token_client_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "apple_token_client_id")
    op.drop_column("users", "apple_refresh_token")
