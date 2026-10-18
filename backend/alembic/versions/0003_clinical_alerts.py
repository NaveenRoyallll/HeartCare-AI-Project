"""Add persisted clinical alerts."""
from alembic import op
import sqlalchemy as sa

revision = "0003_clinical_alerts"
down_revision = "0002_doctor_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "clinical_alerts" not in inspector.get_table_names():
        op.create_table(
            "clinical_alerts",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("patient_id", sa.String(length=36), nullable=False, index=True),
            sa.Column("source_type", sa.String(length=50), nullable=False),
            sa.Column("source_id", sa.String(length=36), nullable=False),
            sa.Column("severity", sa.String(length=20), nullable=False),
            sa.Column("category", sa.String(length=50), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("acknowledged_by", sa.String(length=36), nullable=True),
            sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "clinical_alerts" in inspector.get_table_names():
        op.drop_table("clinical_alerts")
