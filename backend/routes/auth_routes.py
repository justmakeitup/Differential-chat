import re
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, make_response, g
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, UserSession, utc_now
from auth_service import (
    rate_limiter, validate_password_strength, generate_jwt_token,
    hash_token, login_required, generate_reset_token, send_password_reset_email
)
from config import Config

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    ip = request.remote_addr or 'unknown'
    if not rate_limiter.is_allowed(f"reg_{ip}", max_requests=6, window_seconds=60):
        return jsonify({'error': 'Too many registration requests. Please wait a moment.'}), 429

    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    username = (data.get('username') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    password = data.get('password') or ''
    
    # Inline validations
    if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'error': 'A valid email address is required.'}), 400
        
    if not username or len(username) < 3 or not re.match(r"^[a-zA-Z0-9_\.]+$", username):
        return jsonify({'error': 'Username must be at least 3 characters and contain only letters, numbers, dots, or underscores.'}), 400
        
    if not full_name:
        return jsonify({'error': 'Full name is required.'}), 400

    valid_pwd, pwd_err = validate_password_strength(password)
    if not valid_pwd:
        return jsonify({'error': pwd_err}), 400

    # Check for existing email or username
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email address already exists.'}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'This username is already taken. Please choose another.'}), 409

    hashed_pw = generate_password_hash(password, method='scrypt')
    user = User(
        email=email,
        username=username,
        full_name=full_name,
        password_hash=hashed_pw,
        privacy_mode='public',
        onboarding_completed=False
    )
    db.session.add(user)
    db.session.commit()

    session_id = str(uuid.uuid4())
    token = generate_jwt_token(user, session_id)
    
    # Record session
    user_session = UserSession(
        id=session_id,
        user_id=user.id,
        token_hash=hash_token(token),
        ip_address=ip,
        user_agent=request.headers.get('User-Agent', '')[:250],
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.session.add(user_session)
    db.session.commit()

    resp = make_response(jsonify({
        'message': 'Account created successfully.',
        'user': user.to_dict(include_private=True),
        'token': token
    }), 201)

    resp.set_cookie(
        Config.SESSION_COOKIE_NAME,
        token,
        httponly=True,
        samesite='Lax',
        secure=Config.SESSION_COOKIE_SECURE,
        max_age=7 * 24 * 3600
    )
    return resp

@auth_bp.route('/login', methods=['POST'])
def login():
    ip = request.remote_addr or 'unknown'
    if not rate_limiter.is_allowed(f"login_{ip}", max_requests=10, window_seconds=60):
        return jsonify({'error': 'Too many login attempts. Please wait a minute before trying again.'}), 429

    data = request.get_json() or {}
    identifier = (data.get('identifier') or data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'error': 'Please provide your email/username and password.'}), 400

    # Support login with either email or username
    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials. Please verify your details and try again.'}), 401

    session_id = str(uuid.uuid4())
    token = generate_jwt_token(user, session_id)

    # Record/update session
    user_session = UserSession(
        id=session_id,
        user_id=user.id,
        token_hash=hash_token(token),
        ip_address=ip,
        user_agent=request.headers.get('User-Agent', '')[:250],
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.session.add(user_session)
    db.session.commit()

    resp = make_response(jsonify({
        'message': 'Authentication successful.',
        'user': user.to_dict(include_private=True),
        'token': token
    }), 200)

    resp.set_cookie(
        Config.SESSION_COOKIE_NAME,
        token,
        httponly=True,
        samesite='Lax',
        secure=Config.SESSION_COOKIE_SECURE,
        max_age=7 * 24 * 3600
    )
    return resp

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    # Remove session record if present
    token = request.cookies.get(Config.SESSION_COOKIE_NAME)
    if token:
        UserSession.query.filter_by(token_hash=hash_token(token)).delete()
        db.session.commit()

    resp = make_response(jsonify({'message': 'Logged out successfully.'}), 200)
    resp.delete_cookie(Config.SESSION_COOKIE_NAME, samesite=Config.SESSION_COOKIE_SAMESITE, secure=Config.SESSION_COOKIE_SECURE)
    return resp

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'user': g.current_user.to_dict(include_private=True)
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    ip = request.remote_addr or 'unknown'
    if not rate_limiter.is_allowed(f"reset_{ip}", max_requests=4, window_seconds=60):
        return jsonify({'error': 'Too many password reset requests. Please wait a moment.'}), 429

    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    user = User.query.filter_by(email=email).first()
    # Always return a generic success message to prevent user enumeration
    if user:
        reset_token = generate_reset_token()
        # A database leak must not turn a reset token into account access.
        user.reset_token = hashlib.sha256(reset_token.encode('utf-8')).hexdigest()
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()
        send_password_reset_email(user.email, reset_token)

    return jsonify({
        'message': 'If an account matches that email, password reset instructions have been sent.'
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    new_password = data.get('new_password') or ''

    if not token or not new_password:
        return jsonify({'error': 'Reset token and new password are required.'}), 400

    valid_pwd, pwd_err = validate_password_strength(new_password)
    if not valid_pwd:
        return jsonify({'error': pwd_err}), 400

    now = datetime.now(timezone.utc)
    # Using naive comparison safe for SQLite/Postgres
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    user = User.query.filter(User.reset_token == token_hash).first()
    if not user or not user.reset_token_expires_at:
        return jsonify({'error': 'Invalid or expired password reset token.'}), 400
        
    expires_at = user.reset_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < now:
        return jsonify({'error': 'This password reset link has expired. Please request a new one.'}), 400

    user.password_hash = generate_password_hash(new_password, method='scrypt')
    user.reset_token = None
    user.reset_token_expires_at = None
    UserSession.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    return jsonify({'message': 'Password has been successfully reset. You may now sign in.'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json() or {}
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    if not check_password_hash(g.current_user.password_hash, current_password):
        return jsonify({'error': 'Current password does not match.'}), 400

    valid_pwd, pwd_err = validate_password_strength(new_password)
    if not valid_pwd:
        return jsonify({'error': pwd_err}), 400

    g.current_user.password_hash = generate_password_hash(new_password, method='scrypt')
    UserSession.query.filter_by(user_id=g.current_user.id).delete()
    db.session.commit()

    return jsonify({'message': 'Password changed successfully.'}), 200
