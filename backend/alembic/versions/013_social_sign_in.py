"""Social sign-in: provider subject identifiers, and a password that may be absent.

Revision ID: 013
Revises: 012
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The provider's subject identifier, not the email: an Apple user can hide their address
    # behind a relay, and addresses change hands. The sub never changes for the same person.
    op.add_column("users", sa.Column("apple_sub", sa.String(), nullable=True))
    op.add_column("users", sa.Column("google_sub", sa.String(), nullable=True))
    op.create_index("ix_users_apple_sub", "users", ["apple_sub"], unique=True)
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)

    # An account created through Apple or Google has no password at all. Nullable rather than
    # an empty string, so that "has no password" cannot be confused with "password is blank"
    # by any comparison that gets written later.
    #
    # Through batch_alter_table because SQLite cannot ALTER a column at all; on PostgreSQL,
    # where staging and production run, this is the plain ALTER it looks like.
    with op.batch_alter_table("users") as batch:
        batch.alter_column("hashed_password", existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    # Accounts without a password cannot exist under the old schema; they would have to be
    # given one or removed first, which is a decision for whoever runs this, not for a script.
    with op.batch_alter_table("users") as batch:
        batch.alter_column("hashed_password", existing_type=sa.String(), nullable=False)
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_index("ix_users_apple_sub", table_name="users")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "apple_sub")
