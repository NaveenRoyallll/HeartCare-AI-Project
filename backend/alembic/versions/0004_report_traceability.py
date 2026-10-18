"""Add report extraction traceability fields."""
from alembic import op
import sqlalchemy as sa

revision = "0004_report_traceability"
down_revision = "0003_clinical_alerts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("blood_report_results")}
    if "source_excerpt" not in columns:
        op.add_column("blood_report_results", sa.Column("source_excerpt", sa.Text(), nullable=True))
    if "extraction_confidence" not in columns:
        op.add_column("blood_report_results", sa.Column("extraction_confidence", sa.Float(), nullable=True))
    if "source_page" not in columns:
        op.add_column("blood_report_results", sa.Column("source_page", sa.Integer(), nullable=True))
    if "user_confirmed" not in columns:
        op.add_column(
            "blood_report_results",
            sa.Column("user_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade() -> None:
    op.drop_column("blood_report_results", "user_confirmed")
    op.drop_column("blood_report_results", "source_page")
    op.drop_column("blood_report_results", "extraction_confidence")
    op.drop_column("blood_report_results", "source_excerpt")
