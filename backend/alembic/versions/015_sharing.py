"""Sharing apiaries and hives between beekeepers.

Revision ID: 015
Revises: 014
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shares",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("grantee_email", sa.String(), nullable=False),
        sa.Column("grantee_user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("apiary_id", sa.String(), sa.ForeignKey("apiaries.id", ondelete="CASCADE"), nullable=True),
        sa.Column("hive_id", sa.String(), sa.ForeignKey("hives.id", ondelete="CASCADE"), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("token_hash", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("(apiary_id IS NULL) <> (hive_id IS NULL)", name="ck_share_one_target"),
    )
    op.create_index("ix_shares_owner_id", "shares", ["owner_id"])
    op.create_index("ix_shares_grantee_email", "shares", ["grantee_email"])
    op.create_index("ix_shares_grantee_user_id", "shares", ["grantee_user_id"])
    op.create_index("ix_shares_apiary_id", "shares", ["apiary_id"])
    op.create_index("ix_shares_hive_id", "shares", ["hive_id"])
    op.create_index("ix_shares_token_hash", "shares", ["token_hash"], unique=True)

    # Who recorded an inspection. Existing rows stay empty: nobody can say afterwards.
    with op.batch_alter_table("inspections") as batch:
        batch.add_column(sa.Column("created_by_id", sa.String(), nullable=True))
        batch.create_foreign_key(
            "fk_inspections_created_by_id", "users", ["created_by_id"], ["id"], ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("inspections") as batch:
        batch.drop_constraint("fk_inspections_created_by_id", type_="foreignkey")
        batch.drop_column("created_by_id")
    for name in ("token_hash", "hive_id", "apiary_id", "grantee_user_id", "grantee_email", "owner_id"):
        op.drop_index(f"ix_shares_{name}", table_name="shares")
    op.drop_table("shares")
