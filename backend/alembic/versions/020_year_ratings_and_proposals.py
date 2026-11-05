"""What beekeepers say about the beekeeping-year dates, and what admins approve.

The ratings come from a questionnaire with no login, so nothing here identifies anybody: the
position is rounded by the application before it is stored, and the postal code it was looked up
from is dropped.

Revision ID: 020
Revises: 019
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "020"
down_revision: Union[str, None] = "019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "year_ratings",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("entry_key", sa.String(length=80), nullable=False),
        sa.Column(
            "verdict",
            sa.Enum("fits", "too_early", "too_late", "wrong", name="year_verdict_enum"),
            nullable=False,
        ),
        sa.Column("shift_days", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("years_keeping", sa.Integer(), nullable=True),
        sa.Column("device_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("device_hash", "entry_key", name="uq_year_rating_device_entry"),
    )
    op.create_index("ix_year_ratings_entry_key", "year_ratings", ["entry_key"])
    op.create_index("ix_year_ratings_device_hash", "year_ratings", ["device_hash"])

    op.create_table(
        "year_proposals",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("entry_key", sa.String(length=80), nullable=False),
        sa.Column("kind", sa.Enum("shift", "hide", name="year_proposal_kind_enum"), nullable=False),
        sa.Column("shift_days", sa.Integer(), nullable=True),
        sa.Column("rating_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("radius_km", sa.Integer(), nullable=False, server_default="150"),
        sa.Column("country", sa.String(length=2), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="year_proposal_status_enum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("decided_at", sa.DateTime(), nullable=True),
        sa.Column("decided_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint("entry_key", "latitude", "longitude", "kind", name="uq_year_proposal_group"),
    )
    op.create_index("ix_year_proposals_entry_key", "year_proposals", ["entry_key"])
    op.create_index("ix_year_proposals_status", "year_proposals", ["status"])


def downgrade() -> None:
    op.drop_index("ix_year_proposals_status", table_name="year_proposals")
    op.drop_index("ix_year_proposals_entry_key", table_name="year_proposals")
    op.drop_table("year_proposals")
    op.drop_index("ix_year_ratings_device_hash", table_name="year_ratings")
    op.drop_index("ix_year_ratings_entry_key", table_name="year_ratings")
    op.drop_table("year_ratings")

    bind = op.get_bind()
    for name in ("year_proposal_status_enum", "year_proposal_kind_enum", "year_verdict_enum"):
        sa.Enum(name=name).drop(bind, checkfirst=True)
