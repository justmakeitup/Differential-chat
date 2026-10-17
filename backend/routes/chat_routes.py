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
    ).order_by(EncryptedMessage.created_at.asc()).limit(100).all()

    # Mark undelivered messages to current user as delivered
    for m in messages:
        if m.recipient_id == current_user_id and not m.is_delivered:
            m.is_delivered = True
    db.session.commit()

    return jsonify({
        'peer_id': peer_id,
        'messages': [m.to_dict() for m in messages]
    }), 200
