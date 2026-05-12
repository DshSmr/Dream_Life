"""ai_reviews table

Revision ID: 0011_ai_reviews
Revises: 0010_daily_snapshots
Create Date: 2026-05-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0011_ai_reviews"
down_revision: Union[str, None] = "0010_daily_snapshots"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_reviews",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("review_date", sa.Date(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("wins", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("concerns", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("tomorrow_plan", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("fallback", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_ai_reviews_review_date", "ai_reviews", ["review_date"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_ai_reviews_review_date", table_name="ai_reviews")
    op.drop_table("ai_reviews")
