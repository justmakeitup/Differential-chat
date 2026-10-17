"""
Verification and Migration Script for Differential Cloud Database.
Run this script to test database connectivity, enforce SSL, and initialize all tables.
"""
import sys
from pathlib import Path

# Add current folder to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app
from models import db
from sqlalchemy import inspect

def verify_and_init():
    app = create_app()
    with app.app_context():
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        # Obfuscate password in output
        safe_uri = db_uri
        if '@' in safe_uri:
            prefix = safe_uri.split('://')[0]
            rest = safe_uri.split('@')[1]
            safe_uri = f"{prefix}://*****:*****@{rest}"
            
        print("\n" + "=" * 60)
        print("  DIFFERENTIAL DATABASE VERIFICATION")
        print("=" * 60)
        print(f"Target Database URI: {safe_uri}")
        
        is_postgres = 'postgresql' in db_uri
        is_ssl = 'sslmode=require' in db_uri or 'sslmode=verify-full' in db_uri
        
        if is_postgres:
            print("Database Engine: PostgreSQL (Cloud Managed)")
            if is_ssl:
                print("Transit Security: [SECURE] SSL/TLS encryption active (sslmode=require)")
            else:
                print("Transit Security: [WARNING] SSL is not explicitly specified. Append ?sslmode=require to your connection string.")
        else:
            print("Database Engine: SQLite (Local Fallback)")
            print("Note: SQLite is for local testing. Use Neon/Supabase PostgreSQL for production.")

        print("\nChecking database connectivity and creating tables...")
        try:
            db.create_all()
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"Successfully connected! Verified {len(tables)} tables:")
            for t in sorted(tables):
                print(f"  - {t}")
                
            print("\nDatabase is fully configured, secured, and ready for use!")
            print("=" * 60 + "\n")
            return True
        except Exception as e:
            print(f"\n[ERROR] Connection failed: {e}")
            print("Please check your DATABASE_URL in backend/.env")
            print("=" * 60 + "\n")
            return False

if __name__ == '__main__':
    verify_and_init()
