"""
Run from apps/api: python seed.py
Creates admin user and default categories.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.config.database import SessionLocal
from app.config.init_db import init_db
from app.models.user import User, UserRole
from app.models.category import Category
from app.services.auth_service import hash_password

ADMIN_EMAIL = "admin@marketplace.com"
ADMIN_PASSWORD = "Admin1234!"

CATEGORIES = [
    {"name": "Cleaning", "slug": "cleaning", "description": "Home and office cleaning services", "icon": "🧹"},
    {"name": "Plumbing", "slug": "plumbing", "description": "Pipe, drain and water fixture repair", "icon": "🔧"},
    {"name": "Electrical", "slug": "electrical", "description": "Wiring, installation and repairs", "icon": "⚡"},
    {"name": "Beauty", "slug": "beauty", "description": "Salon, grooming and beauty services", "icon": "💄"},
    {"name": "Tutoring", "slug": "tutoring", "description": "Academic and skill tutoring", "icon": "📚"},
    {"name": "Moving", "slug": "moving", "description": "Furniture and house moving services", "icon": "🚚"},
    {"name": "Cooking", "slug": "cooking", "description": "Personal chef and catering services", "icon": "👨‍🍳"},
    {"name": "Gardening", "slug": "gardening", "description": "Lawn care and landscaping", "icon": "🌿"},
]


def seed():
    init_db()
    db = SessionLocal()
    try:
        # Admin user
        if not db.query(User).filter(User.email == ADMIN_EMAIL).first():
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                full_name="Platform Admin",
                role=UserRole.admin,
            )
            db.add(admin)
            print(f"Created admin: {ADMIN_EMAIL}")
        else:
            print("Admin already exists, skipping.")

        # Categories
        for cat_data in CATEGORIES:
            if not db.query(Category).filter(Category.slug == cat_data["slug"]).first():
                cat = Category(**cat_data)
                db.add(cat)
                print(f"Created category: {cat_data['name']}")
            else:
                print(f"Category '{cat_data['name']}' already exists, skipping.")

        db.commit()
        print("\nSeed complete!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
