from flask import Blueprint, request, jsonify, g
from models import db, User, UserInterest, Connection, UserSession, Post
from auth_service import login_required, optional_login
from image_service import process_and_save_image
from config import Config

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('/discover', methods=['GET'])
@optional_login
def discover_users():
    search = request.args.get('q', '').strip().lower()
    tag = request.args.get('tag', '').strip()
    page = int(request.args.get('page', 1))
    limit = min(int(request.args.get('limit', 20)), 50)

    query = User.query.filter(User.privacy_mode != 'incognito')
    
    # Exclude current viewer if logged in
    if g.current_user:
        query = query.filter(User.id != g.current_user.id)

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%")) |
            (User.headline.ilike(f"%{search}%")) |
            (User.bio.ilike(f"%{search}%")) |
            (User.location.ilike(f"%{search}%"))
        )

    if tag:
        query = query.join(UserInterest).filter(UserInterest.tag.ilike(f"%{tag}%"))

    users_page = query.order_by(User.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)

    # Compute connection status for each user relative to viewer
    viewer_id = g.current_user.id if g.current_user else None
    results = []

    for user in users_page.items:
        user_data = user.to_dict()
        user_data['connection_status'] = 'none'
        user_data['connection_id'] = None

        if viewer_id:
            conn = Connection.query.filter(
                ((Connection.requester_id == viewer_id) & (Connection.addressee_id == user.id)) |
                ((Connection.requester_id == user.id) & (Connection.addressee_id == viewer_id))
            ).first()

            if conn:
                user_data['connection_id'] = conn.id
                if conn.status == 'accepted':
                    user_data['connection_status'] = 'connected'
                elif conn.status == 'pending':
                    if conn.requester_id == viewer_id:
                        user_data['connection_status'] = 'pending_sent'
                    else:
                        user_data['connection_status'] = 'pending_received'
                elif conn.status == 'blocked':
                    user_data['connection_status'] = 'blocked'

        results.append(user_data)

    return jsonify({
        'users': results,
        'total': users_page.total,
        'pages': users_page.pages,
        'current_page': page
    }), 200

@user_bp.route('/<username>', methods=['GET'])
@optional_login
def get_user_profile(username):
    user = User.query.filter_by(username=username.lower()).first()
    if not user:
        return jsonify({'error': 'Member not found.'}), 404

    viewer_id = g.current_user.id if g.current_user else None
    is_owner = viewer_id == user.id

    connection_status = 'none'
    connection_id = None
    if viewer_id and not is_owner:
        conn = Connection.query.filter(
            ((Connection.requester_id == viewer_id) & (Connection.addressee_id == user.id)) |
            ((Connection.requester_id == user.id) & (Connection.addressee_id == viewer_id))
        ).first()
        if conn:
            connection_id = conn.id
            if conn.status == 'accepted':
                connection_status = 'connected'
            elif conn.status == 'pending':
                connection_status = 'pending_sent' if conn.requester_id == viewer_id else 'pending_received'
            elif conn.status == 'blocked':
                connection_status = 'blocked'

    # Check privacy controls: if connections_only and viewer is not connected
    is_restricted = False
    if user.privacy_mode == 'connections_only' and not is_owner and connection_status != 'connected':
        is_restricted = True

    # Get posts visible to viewer
    posts_query = Post.query.filter_by(user_id=user.id)
    if not is_owner and connection_status != 'connected':
        posts_query = posts_query.filter_by(privacy_level='public')
    posts = posts_query.order_by(Post.created_at.desc()).all()

    profile_data = user.to_dict(include_private=is_owner)
    profile_data['connection_status'] = connection_status
    profile_data['connection_id'] = connection_id
    profile_data['is_restricted'] = is_restricted
    profile_data['is_owner'] = is_owner
    profile_data['posts'] = [p.to_dict(current_user_id=viewer_id) for p in posts]

    return jsonify({'profile': profile_data}), 200

@user_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json() or {}
    user = g.current_user

    if 'full_name' in data:
        user.full_name = data['full_name'].strip()
    if 'headline' in data:
        user.headline = data['headline'].strip()
    if 'bio' in data:
        user.bio = data['bio'].strip()
    if 'location' in data:
        user.location = data['location'].strip()
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url'].strip()
    if 'banner_url' in data:
        user.banner_url = data['banner_url'].strip()
    if 'privacy_mode' in data and data['privacy_mode'] in ['public', 'connections_only', 'incognito']:
        user.privacy_mode = data['privacy_mode']
    if 'e2ee_public_key' in data:
        user.e2ee_public_key = data['e2ee_public_key'].strip()
    if 'onboarding_completed' in data:
        user.onboarding_completed = bool(data['onboarding_completed'])

    # Update interests tags
    if 'interests' in data and isinstance(data['interests'], list):
        # Remove existing interests
        UserInterest.query.filter_by(user_id=user.id).delete()
        # Add new sanitized interests (limit max 15)
        for tag in data['interests'][:15]:
            tag_clean = tag.strip()
            if tag_clean:
                db.session.add(UserInterest(user_id=user.id, tag=tag_clean))

    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully.',
        'user': user.to_dict(include_private=True)
    }), 200

@user_bp.route('/avatar', methods=['POST'])
@login_required
def upload_avatar():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided in request.'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty image filename.'}), 400

    result, err = process_and_save_image(
        file,
        folder=Config.UPLOAD_FOLDER,
        thumbnail_folder=Config.THUMBNAIL_FOLDER,
        max_dimension=800,
        thumb_dimension=200
    )
    if err:
        return jsonify({'error': err}), 400

    g.current_user.avatar_url = result['image_url']
    db.session.commit()

    return jsonify({
        'message': 'Avatar updated successfully.',
        'avatar_url': result['image_url'],
        'thumbnail_url': result['thumbnail_url']
    }), 200

@user_bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    sessions = UserSession.query.filter_by(user_id=g.current_user.id).order_by(UserSession.last_active.desc()).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200

@user_bp.route('/sessions/<session_id>', methods=['DELETE'])
@login_required
def revoke_session(session_id):
    sess = UserSession.query.filter_by(id=session_id, user_id=g.current_user.id).first()
    if not sess:
        return jsonify({'error': 'Session not found.'}), 404
        
    db.session.delete(sess)
    db.session.commit()
    return jsonify({'message': 'Session revoked.'}), 200

@user_bp.route('/account', methods=['DELETE'])
@login_required
def delete_account():
    user = g.current_user
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Account and all associated records permanently purged.'}), 200
