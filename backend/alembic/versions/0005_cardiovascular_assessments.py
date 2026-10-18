"""Add unified cardiovascular assessment history."""
from alembic import op
import sqlalchemy as sa

revision = "0005_cardiovascular_assessments"
down_revision = "0004_report_traceability"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cardiovascular_assessments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False, index=True),
        sa.Column("assessment_kind", sa.String(length=30), nullable=False),
        sa.Column("classification", sa.String(length=50), nullable=False),
        sa.Column("observations_considered", sa.JSON(), nullable=False),
        sa.Column("input_snapshot", sa.JSON(), nullable=False),
        sa.Column("data_quality", sa.String(length=30), nullable=False),
        sa.Column("missing_inputs", sa.JSON(), nullable=False),
        sa.Column("uncertainty", sa.JSON(), nullable=False),
        sa.Column("recommendations", sa.JSON(), nullable=False),
        sa.Column("emergency_guidance", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("cardiovascular_assessments")
