from flask import Blueprint, request, jsonify, g
from models import db, Notification
from auth_service import login_required

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(user_id=g.current_user.id)\
        .order_by(Notification.created_at.desc())\
        .limit(30)\
        .all()

    unread_count = Notification.query.filter_by(user_id=g.current_user.id, is_read=False).count()

    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    }), 200

@notification_bp.route('/read-all', methods=['POST'])
@login_required
def mark_all_read():
    Notification.query.filter_by(user_id=g.current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read.'}), 200

@notification_bp.route('/<notification_id>/read', methods=['POST'])
@login_required
def mark_one_read(notification_id):
    notif = db.session.get(Notification, notification_id)
    if notif and notif.user_id == g.current_user.id:
        notif.is_read = True
        db.session.commit()
    return jsonify({'message': 'Notification marked as read.'}), 200
