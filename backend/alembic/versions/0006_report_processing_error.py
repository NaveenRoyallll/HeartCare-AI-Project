"""Persist document extraction provider failures."""
from alembic import op
import sqlalchemy as sa

revision = "0006_report_processing_error"
down_revision = "0005_cardiovascular_assessments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("blood_reports", sa.Column("processing_error", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("blood_reports", "processing_error")
