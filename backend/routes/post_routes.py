from flask import Blueprint, request, jsonify, g
from models import db, Post, PostLike, PostComment, Notification, Connection, User
from auth_service import login_required, optional_login
from image_service import process_and_save_image
from config import Config

post_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@post_bp.route('/feed', methods=['GET'])
@optional_login
def get_feed():
    feed_type = request.args.get('type', 'discover') # 'discover' | 'connections'
    page = int(request.args.get('page', 1))
    limit = min(int(request.args.get('limit', 15)), 30)

    viewer_id = g.current_user.id if g.current_user else None

    if feed_type == 'connections' and viewer_id:
        # Get list of connected user IDs
        connections = Connection.query.filter(
            ((Connection.requester_id == viewer_id) | (Connection.addressee_id == viewer_id)) &
            (Connection.status == 'accepted')
        ).all()
        connected_ids = set()
        for c in connections:
            connected_ids.add(c.addressee_id if c.requester_id == viewer_id else c.requester_id)
        connected_ids.add(viewer_id) # Include own posts

        posts_page = Post.query.filter(Post.user_id.in_(list(connected_ids)))\
            .order_by(Post.created_at.desc())\
            .paginate(page=page, per_page=limit, error_out=False)
    else:
        # Public discover feed
        posts_page = Post.query.filter_by(privacy_level='public')\
            .order_by(Post.created_at.desc())\
            .paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        'posts': [p.to_dict(current_user_id=viewer_id) for p in posts_page.items],
        'total': posts_page.total,
        'pages': posts_page.pages,
        'current_page': page
    }), 200

@post_bp.route('', methods=['POST'])
@login_required
def create_post():
    if 'image' not in request.files:
        return jsonify({'error': 'Image file is required. Differential is an image-only social platform.'}), 400

    image_file = request.files['image']
    if not image_file or image_file.filename == '':
        return jsonify({'error': 'Selected image file cannot be empty.'}), 400

    # Mandatory accessibility alt-text
    alt_text = (request.form.get('alt_text') or '').strip()
    if not alt_text:
        return jsonify({'error': 'Descriptive alt-text is required for accessibility and vision-assistance.'}), 400

    caption = (request.form.get('caption') or '').strip()
    privacy_level = request.form.get('privacy_level', 'public')
    if privacy_level not in ['public', 'connections_only']:
        privacy_level = 'public'

    # Process, compress, EXIF-strip, and generate thumbnail
    result, err = process_and_save_image(
        image_file,
        folder=Config.UPLOAD_FOLDER,
        thumbnail_folder=Config.THUMBNAIL_FOLDER,
        max_dimension=2048,
        thumb_dimension=480
    )
    if err:
        return jsonify({'error': err}), 400

    post = Post(
        user_id=g.current_user.id,
        image_url=result['image_url'],
        thumbnail_url=result['thumbnail_url'],
        caption=caption,
        alt_text=alt_text,
        aspect_ratio=result['aspect_ratio'],
        privacy_level=privacy_level
    )
    db.session.add(post)
    db.session.commit()

    return jsonify({
        'message': 'Image post published.',
        'post': post.to_dict(current_user_id=g.current_user.id)
    }), 201

@post_bp.route('/<post_id>', methods=['GET'])
@optional_login
def get_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found.'}), 404

    viewer_id = g.current_user.id if g.current_user else None

    # Check privacy level
    if post.privacy_level == 'connections_only' and post.user_id != viewer_id:
        if not viewer_id:
            return jsonify({'error': 'Authentication required to view this post.'}), 401
        conn = Connection.query.filter(
            ((Connection.requester_id == viewer_id) & (Connection.addressee_id == post.user_id)) |
            ((Connection.requester_id == post.user_id) & (Connection.addressee_id == viewer_id))
        ).filter_by(status='accepted').first()
        if not conn:
            return jsonify({'error': 'This post is restricted to mutual connections.'}), 403

    post_dict = post.to_dict(current_user_id=viewer_id)
    post_dict['comments'] = [c.to_dict() for c in post.comments]
    return jsonify({'post': post_dict}), 200

@post_bp.route('/<post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found.'}), 404

    # Ownership check
    if post.user_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized. You can only delete your own posts.'}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted successfully.'}), 200

@post_bp.route('/<post_id>/like', methods=['POST'])
@login_required
def toggle_like(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found.'}), 404

    existing_like = PostLike.query.filter_by(post_id=post_id, user_id=g.current_user.id).first()
    if existing_like:
        db.session.delete(existing_like)
        liked = False
    else:
        new_like = PostLike(post_id=post_id, user_id=g.current_user.id)
        db.session.add(new_like)
        liked = True

        # Send notification to post author if not liking own post
        if post.user_id != g.current_user.id:
            notif = Notification(
                user_id=post.user_id,
                actor_id=g.current_user.id,
                type='post_like',
                entity_id=post.id,
                message=f"{g.current_user.full_name} appreciated your photograph."
            )
            db.session.add(notif)

    db.session.commit()
    return jsonify({
        'liked': liked,
        'likes_count': len(post.likes)
    }), 200

@post_bp.route('/<post_id>/comments', methods=['POST'])
@login_required
def add_comment(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found.'}), 404

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'Comment content cannot be empty.'}), 400

    comment = PostComment(
        post_id=post_id,
        user_id=g.current_user.id,
        content=content
    )
    db.session.add(comment)

    # Notify post author if not commenting on own post
    if post.user_id != g.current_user.id:
        notif = Notification(
            user_id=post.user_id,
            actor_id=g.current_user.id,
            type='post_comment',
            entity_id=post.id,
            message=f"{g.current_user.full_name} commented: \"{content[:40]}{'...' if len(content)>40 else ''}\""
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify({
        'message': 'Comment added.',
        'comment': comment.to_dict()
    }), 201

@post_bp.route('/<post_id>/comments/<comment_id>', methods=['DELETE'])
@login_required
def delete_comment(post_id, comment_id):
    comment = db.session.get(PostComment, comment_id)
    if not comment or comment.post_id != post_id:
        return jsonify({'error': 'Comment not found.'}), 404

    # Allow comment author OR post author to delete
    post = db.session.get(Post, post_id)
    if comment.user_id != g.current_user.id and (post and post.user_id != g.current_user.id):
        return jsonify({'error': 'Unauthorized to delete this comment.'}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment removed.'}), 200
