"""Where supporter status comes from, now that it can be bought.

`users.is_supporter` stays exactly where it is and keeps its meaning for all three clients. What
changes is its origin: until now an admin set it by hand, and from here it is a cache of what this
table says. The column is kept rather than replaced because every client already reads it, and a
subscription is not something a hive list should have to join against.

Existing supporters are carried over as `manual` records, so nobody loses access to a feature they
already had -- including `review@multihead.de`, which the store reviewers sign in with and which
exists only because somebody made it by hand.

Revision ID: 021
Revises: 020
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "021"
down_revision: Union[str, None] = "020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column(
            "source",
            sa.Enum("apple", "google", "web", "manual", name="subscription_source_enum"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("active", "grace", "expired", "refunded", "revoked",
                    name="subscription_status_enum"),
            nullable=False,
        ),
        sa.Column("product_id", sa.String(length=120), nullable=True),
        # Null for `manual`, which does not expire, and for a revoked record.
        sa.Column("current_period_end", sa.DateTime(), nullable=True),
        sa.Column("will_renew", sa.Boolean(), nullable=False, server_default=sa.false()),
        # The provider's identifier for the purchase. Unique, so one purchase cannot be handed to
        # two accounts -- the oldest trick there is.
        sa.Column("store_txn_id", sa.String(length=255), nullable=True),
        # What the provider actually said, kept so a disputed access can be reconstructed rather
        # than argued about.
        sa.Column("raw", sa.Text(), nullable=True),
        # The provider's own event timestamp. Webhooks retry and can arrive out of order; an event
        # older than what is stored is dropped instead of applied.
        sa.Column("event_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("source", "store_txn_id", name="uq_subscription_source_txn"),
    )
    op.create_index("ix_subscriptions_user_status", "subscriptions", ["user_id", "status"])

    # Everyone who is a supporter today keeps it, as a grant rather than a purchase.
    op.execute(
        """
        INSERT INTO subscriptions (id, user_id, source, status, will_renew, created_at, updated_at)
        SELECT
            'migrated-' || users.id,
            users.id,
            'manual',
            'active',
            false,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM users
        WHERE users.is_supporter = true
        """
    )


def downgrade() -> None:
    op.drop_index("ix_subscriptions_user_status", table_name="subscriptions")
    op.drop_table("subscriptions")
    # The enums are dropped with the table on SQLite; PostgreSQL keeps the types around.
    sa.Enum(name="subscription_source_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="subscription_status_enum").drop(op.get_bind(), checkfirst=True)
