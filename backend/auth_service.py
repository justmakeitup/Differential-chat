import time
import re
import secrets
import hashlib
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from flask import request, jsonify, g, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, UserSession, utc_now
from config import Config

# Simple token-bucket rate limiter per IP/key
class SimpleRateLimiter:
    def __init__(self):
        self.requests = {} # { key: [(timestamp, ...)] }

    def is_allowed(self, key: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        now = time.time()
        window_start = now - window_seconds
        
        # Clean up old timestamps
        timestamps = self.requests.get(key, [])
        timestamps = [ts for ts in timestamps if ts > window_start]
        
        if len(timestamps) >= max_requests:
            self.requests[key] = timestamps
            return False
            
        timestamps.append(now)
        self.requests[key] = timestamps
        return True

rate_limiter = SimpleRateLimiter()

def validate_password_strength(password: str):
    """
    Validates password strength:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special symbol
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters in length."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one numeric digit."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        return False, "Password must contain at least one special character."
    return True, ""

def generate_jwt_token(user: User, session_id: str, expires_in_days: int = 7) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': user.id,
        'username': user.username,
        'email': user.email,
        'sid': session_id,
        'iat': now,
        'exp': now + timedelta(days=expires_in_days)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def is_active_session(token: str, payload: dict) -> bool:
    """Require a non-revoked server-side session as well as a valid JWT."""
    session_id = payload.get('sid')
    if not session_id:
        return False
    session = db.session.get(UserSession, session_id)
    if not session or session.user_id != payload.get('sub'):
        return False
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return session.token_hash == hash_token(token) and expires_at > utc_now()

def get_token_from_request():
    # 1. Check HTTP-Only cookie
    token = request.cookies.get('aetheris_token')
    if token:
        return token
    # 2. Check Authorization Header Bearer token
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
            
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Session expired or invalid token'}), 401
        if not is_active_session(token, payload):
            return jsonify({'error': 'Session has been revoked or expired'}), 401
            
        user = db.session.get(User, payload['sub'])
        if not user:
            return jsonify({'error': 'User account not found'}), 401
            
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def optional_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()
        g.current_user = None
        if token:
            payload = decode_jwt_token(token)
            if payload:
                g.current_user = db.session.get(User, payload['sub'])
        return f(*args, **kwargs)
    return decorated_function

def generate_reset_token():
    return secrets.token_urlsafe(32)

def send_password_reset_email(recipient: str, reset_token: str) -> bool:
    """Deliver the raw one-time token only over the configured SMTP TLS channel."""
    if not all((Config.SMTP_HOST, Config.SMTP_USERNAME, Config.SMTP_PASSWORD, Config.SMTP_FROM_EMAIL)):
        current_app.logger.warning('Password-reset email requested but SMTP is not configured.')
        return False
    message = EmailMessage()
    message['Subject'] = 'Your password reset code'
    message['From'] = Config.SMTP_FROM_EMAIL
    message['To'] = recipient
    message.set_content(
        'Use this one-time code to reset your password. It expires in one hour.\n\n'
        f'{reset_token}\n\nIf you did not request this, you can ignore this email.'
    )
    try:
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            smtp.send_message(message)
        return True
    except (OSError, smtplib.SMTPException):
        current_app.logger.exception('Password-reset email delivery failed.')
        return False
