"""
Run this once to create all tables: python -m app.config.init_db
"""
from app.config.database import Base, engine
import app.models  # noqa: F401 – registers all models with Base


def init_db():
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")


if __name__ == "__main__":
    init_db()
