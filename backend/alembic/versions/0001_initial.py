"""Create the application schema."""
from alembic import op
from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    from app.core.database import Base
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    from app.core.database import Base
    from app import models  # noqa: F401
    Base.metadata.drop_all(bind=bind)
