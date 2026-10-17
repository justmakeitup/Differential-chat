import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(40), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    full_name = db.Column(db.String(100), nullable=False)
    headline = db.Column(db.String(160), default="")
    bio = db.Column(db.Text, default="")
    location = db.Column(db.String(100), default="")
    avatar_url = db.Column(db.String(500), default="")
    banner_url = db.Column(db.String(500), default="")
    
    # Privacy controls: 'public' | 'connections_only' | 'incognito'
    privacy_mode = db.Column(db.String(20), default='public', nullable=False)
    
    # Cryptographic identity: public key string (ECDH P-256) for verifying E2EE WebRTC peer identities
    e2ee_public_key = db.Column(db.Text, default="")
    
    is_verified = db.Column(db.Boolean, default=False)
    onboarding_completed = db.Column(db.Boolean, default=False)
    
    # Password reset support
    # SHA-256 digest of a one-time recovery token; plaintext recovery tokens are never stored.
    reset_token = db.Column(db.String(64), nullable=True)
    reset_token_expires_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=utc_now)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    interests = db.relationship('UserInterest', backref='user', cascade='all, delete-orphan', lazy=True)
    posts = db.relationship('Post', backref='author', cascade='all, delete-orphan', lazy=True)
    sessions = db.relationship('UserSession', backref='user', cascade='all, delete-orphan', lazy=True)
    notifications_received = db.relationship('Notification', foreign_keys='Notification.user_id', backref='recipient', cascade='all, delete-orphan', lazy=True)

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'headline': self.headline or '',
            'bio': self.bio or '',
            'location': self.location or '',
            'avatar_url': self.avatar_url or '',
            'banner_url': self.banner_url or '',
            'privacy_mode': self.privacy_mode,
            'is_verified': self.is_verified,
            'onboarding_completed': self.onboarding_completed,
            'interests': [i.tag for i in self.interests],
            'posts_count': len(self.posts),
            'e2ee_public_key': self.e2ee_public_key or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_private:
            data['email'] = self.email
        return data


class UserInterest(db.Model):
    __tablename__ = 'user_interests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    tag = db.Column(db.String(60), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now)


class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.Text, default="")
    alt_text = db.Column(db.Text, nullable=False)  # Required accessibility alt-text!
    aspect_ratio = db.Column(db.String(20), default="4:5")
    privacy_level = db.Column(db.String(20), default="public")  # 'public' | 'connections_only'
    created_at = db.Column(db.DateTime, default=utc_now, index=True)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    likes = db.relationship('PostLike', backref='post', cascade='all, delete-orphan', lazy=True)
    comments = db.relationship('PostComment', backref='post', cascade='all, delete-orphan', lazy=True, order_by='PostComment.created_at.asc()')

    def to_dict(self, current_user_id=None):
        has_liked = False
        if current_user_id:
            has_liked = any(like.user_id == current_user_id for like in self.likes)
            
        return {
            'id': self.id,
            'user_id': self.user_id,
            'author': {
                'id': self.author.id,
                'username': self.author.username,
                'full_name': self.author.full_name,
                'avatar_url': self.author.avatar_url,
                'is_verified': self.author.is_verified,
            } if self.author else None,
            'image_url': self.image_url,
            'thumbnail_url': self.thumbnail_url,
            'caption': self.caption,
            'alt_text': self.alt_text,
            'aspect_ratio': self.aspect_ratio,
            'privacy_level': self.privacy_level,
            'likes_count': len(self.likes),
            'comments_count': len(self.comments),
            'has_liked': has_liked,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PostLike(db.Model):
    __tablename__ = 'post_likes'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    __table_args__ = (
        db.UniqueConstraint('post_id', 'user_id', name='uq_post_like_user'),
    )


class PostComment(db.Model):
    __tablename__ = 'post_comments'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    user = db.relationship('User', backref='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'author': {
                'id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.full_name,
                'avatar_url': self.user.avatar_url,
                'is_verified': self.user.is_verified
            } if self.user else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Connection(db.Model):
    __tablename__ = 'connections'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    requester_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    addressee_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    status = db.Column(db.String(20), default='pending', nullable=False)  # 'pending', 'accepted', 'declined', 'blocked'
    note = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=utc_now)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)

    requester = db.relationship('User', foreign_keys=[requester_id], backref='connections_sent')
    addressee = db.relationship('User', foreign_keys=[addressee_id], backref='connections_received')

    __table_args__ = (
        db.UniqueConstraint('requester_id', 'addressee_id', name='uq_connection_pair'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'addressee_id': self.addressee_id,
            'status': self.status,
            'note': self.note,
            'requester': self.requester.to_dict() if self.requester else None,
            'addressee': self.addressee.to_dict() if self.addressee else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class UserSession(db.Model):
    __tablename__ = 'user_sessions'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token_hash = db.Column(db.String(64), nullable=False, index=True)
    ip_address = db.Column(db.String(45), default="")
    user_agent = db.Column(db.String(255), default="")
    last_active = db.Column(db.DateTime, default=utc_now)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    def to_dict(self):
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'last_active': self.last_active.isoformat() if self.last_active else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    actor_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(40), nullable=False)  # 'connection_request', 'connection_accepted', 'post_like', 'post_comment'
    entity_id = db.Column(db.String(36), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now, index=True)

    actor = db.relationship('User', foreign_keys=[actor_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'actor_id': self.actor_id,
            'actor': {
                'id': self.actor.id,
                'username': self.actor.username,
                'full_name': self.actor.full_name,
                'avatar_url': self.actor.avatar_url
            } if self.actor else None,
            'type': self.type,
            'entity_id': self.entity_id,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class MetadataRecord(db.Model):
    __tablename__ = 'metadata_records'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    value = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)


class EncryptedMessage(db.Model):
    """
    Zero-Knowledge Encrypted Message Envelope.
    Plaintext content NEVER touches the database or server.
    Messages are encrypted on the client device using AES-GCM 256-bit
    with keys derived via ECDH P-256 before being stored.
    """
    __tablename__ = 'encrypted_messages'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    recipient_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Cryptographic payload (Base64)
    ciphertext = db.Column(db.Text, nullable=False)
    iv = db.Column(db.String(64), nullable=False)
    key_fingerprint = db.Column(db.String(64), default="")
    message_type = db.Column(db.String(20), default="text")
    
    is_delivered = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now, index=True)

    sender = db.relationship('User', foreign_keys=[sender_id])
    recipient = db.relationship('User', foreign_keys=[recipient_id])

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'ciphertext': self.ciphertext,
            'iv': self.iv,
            'key_fingerprint': self.key_fingerprint,
            'message_type': self.message_type,
            'is_delivered': self.is_delivered,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

