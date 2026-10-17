from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from auth_service import decode_jwt_token, is_active_session
from config import Config

socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

# In-memory mapping of active user connections: { user_id: set([socket_sid]) }
active_user_sockets = {}
socket_to_user = {}

def init_signaling(app):
    socketio.init_app(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect(auth):
    token = None
    if isinstance(auth, dict):
        token = auth.get('token')
    if not token:
        # Check query params as fallback
        token = request.args.get('token')

    if not token:
        # Check cookies
        token = request.cookies.get(Config.SESSION_COOKIE_NAME)

    if not token:
        return False # Reject unauthenticated socket connection

    payload = decode_jwt_token(token)
    if not payload or not is_active_session(token, payload):
        return False

    user_id = payload['sub']
    sid = request.sid

    # Store mapping
    socket_to_user[sid] = user_id
    if user_id not in active_user_sockets:
        active_user_sockets[user_id] = set()
    active_user_sockets[user_id].add(sid)

    # Join user's individual room
    join_room(f"user_{user_id}")

    # Emit self online confirmation and broadcast presence
    emit('signaling_ready', {'user_id': user_id, 'status': 'connected'})
    # Immediately send the newly connected client all currently online users
    emit('presence_status', {uid: True for uid in active_user_sockets.keys()})
    emit('presence_update', {'user_id': user_id, 'online': True}, broadcast=True)

    # Signal presence of pending offline encrypted messages awaiting local delivery
    try:
        from models import EncryptedMessage
        pending_count = EncryptedMessage.query.filter_by(recipient_id=user_id, is_delivered=False).count()
        if pending_count > 0:
            emit('offline_messages_available', {'count': pending_count})
    except Exception as e:
        print("[Signaling pending check error]:", e)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    user_id = socket_to_user.pop(sid, None)
    if user_id and user_id in active_user_sockets:
        active_user_sockets[user_id].discard(sid)
        if not active_user_sockets[user_id]:
            del active_user_sockets[user_id]
            emit('presence_update', {'user_id': user_id, 'online': False}, broadcast=True)

@socketio.on('check_presence')
def handle_check_presence(data):
    """
    Checks if a list of user IDs are currently connected.
    """
    target_ids = data.get('user_ids', [])
    presence_map = {uid: (uid in active_user_sockets and len(active_user_sockets[uid]) > 0) for uid in target_ids}
    emit('presence_status', presence_map)

# ==========================================
# WebRTC Signaling Relays (Zero Content Logged)
# ==========================================

@socketio.on('signal_offer')
def handle_signal_offer(data):
    """
    Relays WebRTC SDP Offer from caller to target peer.
    Zero message data is handled or inspected.
    """
    sid = request.sid
    caller_id = socket_to_user.get(sid)
    target_id = data.get('target_user_id')
    offer = data.get('offer')
    key_fingerprint = data.get('key_fingerprint')

    if not caller_id or not target_id or not offer:
        return

    emit('signal_offer_received', {
        'from_user_id': caller_id,
        'offer': offer,
        'key_fingerprint': key_fingerprint
    }, room=f"user_{target_id}")

@socketio.on('signal_answer')
def handle_signal_answer(data):
    """
    Relays WebRTC SDP Answer from callee back to caller.
    """
    sid = request.sid
    callee_id = socket_to_user.get(sid)
    target_id = data.get('target_user_id')
    answer = data.get('answer')
    key_fingerprint = data.get('key_fingerprint')

    if not callee_id or not target_id or not answer:
        return

    emit('signal_answer_received', {
        'from_user_id': callee_id,
        'answer': answer,
        'key_fingerprint': key_fingerprint
    }, room=f"user_{target_id}")

@socketio.on('signal_ice_candidate')
def handle_signal_ice(data):
    """
    Relays WebRTC ICE candidate to target peer for direct NAT traversal.
    """
    sid = request.sid
    sender_id = socket_to_user.get(sid)
    target_id = data.get('target_user_id')
    candidate = data.get('candidate')

    if not sender_id or not target_id or not candidate:
        return

    emit('signal_ice_candidate_received', {
        'from_user_id': sender_id,
        'candidate': candidate
    }, room=f"user_{target_id}")

@socketio.on('signal_typing')
def handle_signal_typing(data):
    """
    Relays typing indication flag to peer.
    """
    sid = request.sid
    sender_id = socket_to_user.get(sid)
    target_id = data.get('target_user_id')
    is_typing = data.get('is_typing', False)

    if sender_id and target_id:
        emit('signal_typing_received', {
            'from_user_id': sender_id,
            'is_typing': is_typing
        }, room=f"user_{target_id}")

@socketio.on('signal_peer_ready')
def handle_signal_peer_ready(data):
    """
    Relays signal_peer_ready event to target peer to trigger negotiation.
    """
    sid = request.sid
    sender_id = socket_to_user.get(sid)
    target_id = data.get('target_user_id') if isinstance(data, dict) else None

    if sender_id and target_id:
        emit('signal_peer_ready_received', {
            'from_user_id': sender_id
        }, room=f"user_{target_id}")
