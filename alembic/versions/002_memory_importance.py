"""Add memory importance scoring and metadata for cognitive tiers

Revision ID: 002
Revises: 001
Create Date: 2026-03-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "memories",
        sa.Column("importance_score", sa.Float(), nullable=True),
    )
    op.add_column(
        "memories",
        sa.Column("tier", sa.String(32), nullable=True),
    )
    op.create_index(
        "ix_memories_importance_score",
        "memories",
        ["importance_score"],
        postgresql_where=sa.text("importance_score IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_memories_importance_score", table_name="memories")
    op.drop_column("memories", "tier")
    op.drop_column("memories", "importance_score")
