"""Add doctor verification profile fields."""
from alembic import op
import sqlalchemy as sa

revision = "0002_doctor_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    existing = {item["name"] for item in inspector.get_columns("users")}
    columns = {
        "license_number": sa.Column("license_number", sa.String(length=100), nullable=True),
        "specialty": sa.Column("specialty", sa.String(length=150), nullable=True),
        "hospital_affiliation": sa.Column("hospital_affiliation", sa.String(length=255), nullable=True),
    }
    for name, column in columns.items():
        if name not in existing:
            op.add_column("users", column)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    existing = {item["name"] for item in inspector.get_columns("users")}
    for name in ("hospital_affiliation", "specialty", "license_number"):
        if name in existing:
            op.drop_column("users", name)
