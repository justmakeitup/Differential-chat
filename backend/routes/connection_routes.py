from flask import Blueprint, request, jsonify, g
from models import db, Connection, User, Notification
from auth_service import login_required

connection_bp = Blueprint('connections', __name__, url_prefix='/api/connections')

@connection_bp.route('', methods=['GET'])
@login_required
def get_connections():
    user_id = g.current_user.id

    # Active mutual connections
    active_conns = Connection.query.filter(
        ((Connection.requester_id == user_id) | (Connection.addressee_id == user_id)) &
        (Connection.status == 'accepted')
    ).all()

    # Pending incoming requests
    received_requests = Connection.query.filter_by(addressee_id=user_id, status='pending').all()

    # Pending outgoing requests
    sent_requests = Connection.query.filter_by(requester_id=user_id, status='pending').all()

    def format_active(c):
        peer = c.addressee if c.requester_id == user_id else c.requester
        return {
            'connection_id': c.id,
            'peer': peer.to_dict() if peer else None,
            'since': c.updated_at.isoformat() if c.updated_at else None
        }

    return jsonify({
        'active': [format_active(c) for c in active_conns],
        'received': [c.to_dict() for c in received_requests],
        'sent': [c.to_dict() for c in sent_requests]
    }), 200

@connection_bp.route('/request', methods=['POST'])
@login_required
def send_request():
    data = request.get_json() or {}
    target_id = data.get('target_user_id')
    username = data.get('username')
    note = (data.get('note') or '').strip()[:200]

    target = None
    if target_id:
        target = db.session.get(User, target_id)
    elif username:
        target = User.query.filter_by(username=username.lower()).first()

    if not target:
        return jsonify({'error': 'Target user not found.'}), 404

    if target.id == g.current_user.id:
        return jsonify({'error': 'You cannot initiate a connection with yourself.'}), 400

    # Check for existing connection
    existing = Connection.query.filter(
        ((Connection.requester_id == g.current_user.id) & (Connection.addressee_id == target.id)) |
        ((Connection.requester_id == target.id) & (Connection.addressee_id == g.current_user.id))
    ).first()

    if existing:
        if existing.status == 'accepted':
            return jsonify({'error': 'You are already connected with this member.'}), 400
        elif existing.status == 'pending':
            if existing.requester_id == g.current_user.id:
                return jsonify({'error': 'Connection request already pending.'}), 400
            else:
                # Target already requested viewer -> auto-accept
                existing.status = 'accepted'
                db.session.commit()
                return jsonify({'message': 'Mutual connection established.', 'connection': existing.to_dict()}), 200
        elif existing.status == 'blocked':
            return jsonify({'error': 'Unable to connect with this member.'}), 403

    conn = Connection(
        requester_id=g.current_user.id,
        addressee_id=target.id,
        status='pending',
        note=note
    )
    db.session.add(conn)

    # Create notification for target
    notif = Notification(
        user_id=target.id,
        actor_id=g.current_user.id,
        type='connection_request',
        entity_id=conn.id,
        message=f"{g.current_user.full_name} sent you a connection invitation."
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'message': 'Connection invitation transmitted.',
        'connection': conn.to_dict()
    }), 201

@connection_bp.route('/<connection_id>/accept', methods=['POST'])
@login_required
def accept_request(connection_id):
    conn = db.session.get(Connection, connection_id)
    if not conn:
        return jsonify({'error': 'Connection request not found.'}), 404

    if conn.addressee_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized to accept this request.'}), 403

    conn.status = 'accepted'

    # Notify requester
    notif = Notification(
        user_id=conn.requester_id,
        actor_id=g.current_user.id,
        type='connection_accepted',
        entity_id=conn.id,
        message=f"{g.current_user.full_name} accepted your connection invitation."
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({'message': 'Connection confirmed.', 'connection': conn.to_dict()}), 200

@connection_bp.route('/<connection_id>/decline', methods=['POST'])
@login_required
def decline_request(connection_id):
    conn = db.session.get(Connection, connection_id)
    if not conn:
        return jsonify({'error': 'Connection not found.'}), 404

    if conn.addressee_id != g.current_user.id and conn.requester_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    db.session.delete(conn)
    db.session.commit()
    return jsonify({'message': 'Invitation dismissed.'}), 200

@connection_bp.route('/<connection_id>', methods=['DELETE'])
@login_required
def delete_connection(connection_id):
    conn = db.session.get(Connection, connection_id)
    if not conn:
        return jsonify({'error': 'Connection not found.'}), 404

    if conn.addressee_id != g.current_user.id and conn.requester_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized.'}), 403

    db.session.delete(conn)
    db.session.commit()
    return jsonify({'message': 'Connection removed.'}), 200
