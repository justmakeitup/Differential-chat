import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

class Config:
    ENV = os.getenv('FLASK_ENV', 'development')
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET = os.getenv('JWT_SECRET')
    if ENV == 'production' and (not SECRET_KEY or not JWT_SECRET):
        raise RuntimeError('SECRET_KEY and JWT_SECRET must be set in production.')
    # Local-only fallbacks keep first-run development simple. They are never accepted in production.
    SECRET_KEY = SECRET_KEY or 'local-development-only-change-me'
    JWT_SECRET = JWT_SECRET or 'local-development-only-change-me'
    
    db_env = os.getenv('DATABASE_URL')
    if not db_env or db_env.startswith('sqlite:///aetheris.db'):
        db_url = f"sqlite:///{BASE_DIR.as_posix()}/aetheris.db"
    else:
        db_url = db_env
    # Handle older postgres:// format from some cloud providers
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload handling
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    THUMBNAIL_FOLDER = BASE_DIR / 'uploads' / 'thumbnails'
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 8 * 1024 * 1024)) # 8MB
    
    # Allowed image MIME types and extensions
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
    
    # Strict video rejection
    REJECTED_EXTENSIONS = {'mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v', '3gp'}
    
    # CORS
    CORS_ORIGINS = [orig.strip() for orig in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')]
    
    # Cookie & Security settings
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = ENV == 'production'
    SESSION_COOKIE_NAME = 'aetheris_token'

    # Optional SMTP delivery for password-reset codes. Keep these backend-only.
    SMTP_HOST = os.getenv('SMTP_HOST')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL')
    
    # Business Contact Address configuration
    BUSINESS_NAME = os.getenv('BUSINESS_NAME', 'Differential Privacy Technologies Inc.')
    BUSINESS_ADDRESS_LINE1 = os.getenv('BUSINESS_ADDRESS_LINE1', '450 Townsend Street')
    BUSINESS_ADDRESS_LINE2 = os.getenv('BUSINESS_ADDRESS_LINE2', 'Suite 300')
    BUSINESS_CITY = os.getenv('BUSINESS_CITY', 'San Francisco')
    BUSINESS_STATE = os.getenv('BUSINESS_STATE', 'CA')
    BUSINESS_POSTAL_CODE = os.getenv('BUSINESS_POSTAL_CODE', '94107')
    BUSINESS_COUNTRY = os.getenv('BUSINESS_COUNTRY', 'United States')
    BUSINESS_EMAIL = os.getenv('BUSINESS_EMAIL', 'concierge@differential.network')
    
    ANALYTICS_ID = os.getenv('VITE_ANALYTICS_ID', 'DIFF-PRV-98421')
