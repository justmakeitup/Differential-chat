from flask import Blueprint, request, jsonify, g
from models import db, EncryptedMessage, Connection, User, utc_now
from auth_service import login_required

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('/messages', methods=['POST'])
@login_required
def send_encrypted_message():
    """
    Persist an end-to-end encrypted message envelope.
    The server NEVER receives or stores plaintext.
    """
    data = request.get_json() or {}
    recipient_id = data.get('recipient_id')
    ciphertext = data.get('ciphertext')
    iv = data.get('iv')
    key_fingerprint = data.get('key_fingerprint', '')
    message_type = data.get('message_type', 'text')

    if not recipient_id or not ciphertext or not iv:
        return jsonify({'error': 'Recipient ID, ciphertext, and IV are required.'}), 400

    recipient = db.session.get(User, recipient_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found.'}), 404

    # Verify mutual connection exists and is accepted
    current_user_id = g.current_user.id
    conn = Connection.query.filter(
        ((Connection.requester_id == current_user_id) & (Connection.addressee_id == recipient_id)) |
        ((Connection.requester_id == recipient_id) & (Connection.addressee_id == current_user_id)),
        Connection.status == 'accepted'
    ).first()

    if not conn:
        return jsonify({'error': 'You can only exchange encrypted messages with confirmed connections.'}), 403

    msg = EncryptedMessage(
        sender_id=current_user_id,
        recipient_id=recipient_id,
        ciphertext=ciphertext,
        iv=iv,
        key_fingerprint=key_fingerprint,
        message_type=message_type,
        is_delivered=False
    )
    db.session.add(msg)
    db.session.commit()

    # Real-time relay via Socket.IO to recipient room if connected
    try:
        from signaling import socketio
        from models import Notification
        msg_dict = msg.to_dict()

        socketio.emit('encrypted_message_received', {
            'message': msg_dict,
            'sender': {
                'id': g.current_user.id,
                'full_name': g.current_user.full_name,
                'username': g.current_user.username,
                'avatar_url': g.current_user.avatar_url
            }
        }, room=f"user_{recipient_id}")

        # Also dispatch an in-app and push notification to recipient
        notif = Notification(
            user_id=recipient_id,
            actor_id=current_user_id,
            type='chat_message',
            entity_id=current_user_id,
            message=f"{g.current_user.full_name} sent you an encrypted transmission."
        )
        db.session.add(notif)
        db.session.commit()
        socketio.emit('notification_received', notif.to_dict(), room=f"user_{recipient_id}")
    except Exception as e:
        print("[Chat Relay Error]:", e)

    return jsonify({
        'message': 'Encrypted envelope stored successfully.',
        'data': msg.to_dict()
    }), 201

@chat_bp.route('/messages/<peer_id>', methods=['GET'])
@login_required
def get_encrypted_history(peer_id):
    """
    Retrieve encrypted message history between the authenticated user and a peer.
    Only encrypted ciphertexts and IVs are returned.
    """
    current_user_id = g.current_user.id

    messages = EncryptedMessage.query.filter(
        ((EncryptedMessage.sender_id == current_user_id) & (EncryptedMessage.recipient_id == peer_id)) |
        ((EncryptedMessage.sender_id == peer_id) & (EncryptedMessage.recipient_id == current_user_id))
    ).order_by(EncryptedMessage.created_at.asc()).limit(150).all()

    # Mark undelivered messages to current user as delivered
    delivered_ids = []
    for m in messages:
        if m.recipient_id == current_user_id and not m.is_delivered:
            m.is_delivered = True
            delivered_ids.append(m.id)

    if delivered_ids:
        db.session.commit()
        try:
            from signaling import socketio
            socketio.emit('message_delivery_receipt', {
                'peer_id': current_user_id,
                'message_ids': delivered_ids,
                'status': 'delivered'
            }, room=f"user_{peer_id}")
        except Exception as e:
            print("[Receipt Emit Error]:", e)

    return jsonify({
        'peer_id': peer_id,
        'messages': [m.to_dict() for m in messages]
    }), 200

@chat_bp.route('/pending', methods=['GET'])
@login_required
def get_pending_messages():
    """
    Returns undelivered encrypted messages waiting for current user across all peers.
    """
    current_user_id = g.current_user.id
    pending = EncryptedMessage.query.filter_by(
        recipient_id=current_user_id,
        is_delivered=False
    ).order_by(EncryptedMessage.created_at.asc()).all()

    return jsonify({
        'total_pending': len(pending),
        'messages': [m.to_dict() for m in pending]
    }), 200

@chat_bp.route('/messages/<message_id>/delivered', methods=['POST'])
@login_required
def mark_message_delivered(message_id):
    current_user_id = g.current_user.id
    msg = db.session.get(EncryptedMessage, message_id)
    if msg and msg.recipient_id == current_user_id and not msg.is_delivered:
        msg.is_delivered = True
        db.session.commit()
        try:
            from signaling import socketio
            socketio.emit('message_delivery_receipt', {
                'peer_id': current_user_id,
                'message_ids': [msg.id],
                'status': 'delivered'
            }, room=f"user_{msg.sender_id}")
        except Exception:
            pass
    return jsonify({'message': 'Delivered receipt confirmed.'}), 200
