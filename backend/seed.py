import sys
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from app import create_app
from models import db, User, UserInterest, Post, PostLike, PostComment, Connection, Notification

app = create_app()

def seed_database():
    with app.app_context():
        print("[*] Rebuilding and seeding Differential database...")
        db.drop_all()
        db.create_all()

        now = datetime.now(timezone.utc)
        default_pwd = generate_password_hash("Cipher@2026", method='scrypt')

        users_data = [
            {
                'username': 'elena_v',
                'email': 'elena@differential.network',
                'full_name': 'Elena Rostova',
                'headline': 'Architectural Minimalist & Analog Leica M6 Purist',
                'bio': 'Documenting the silence of concrete monolithic forms across Tokyo, Berlin, and Reykjavik. Searching for depth beyond the algorithmic noise.',
                'location': 'Reykjavik / Berlin',
                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Brutalism', 'Medium Format', 'Monochrome', 'Kyoto Aesthetics', 'Spatial Audio'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9w3V2F6Zq1gR8kJx9mX3yT4pL1rO9bC6vF8d2s3a4e5g='
            },
            {
                'username': 'julian_k',
                'email': 'julian@differential.network',
                'full_name': 'Julian Vance',
                'headline': 'Computational Neuroscientist & Dark Ambient Composer',
                'bio': 'Exploring non-linear signal processing and neural acoustic synchronization. Privacy maximalist and modular synthesizer builder.',
                'location': 'Zürich, Switzerland',
                'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Computational Neuroscience', 'Modular Synthesizers', 'Zero-Knowledge Cryptography', 'Philosophy of Mind'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEn5x7K9p2m3v4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0='
            },
            {
                'username': 'soraya_m',
                'email': 'soraya@differential.network',
                'full_name': 'Soraya Mir',
                'headline': 'Curator at Pavilion Noir | Modern Geometric Sculptures',
                'bio': 'Interrogating light, shadow, and negative space through brushed bronze and obsidian stone. Believer in intentional human encounters.',
                'location': 'Milan / London',
                'avatar_url': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Geometric Sculpture', 'Curatorial Theory', 'Obsidian Minerals', 'Brushed Bronze'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE3x4c5v6b7n8m9a0s1d2f3g4h5j6k7l8z9x0c1v2b3n4m='
            },
            {
                'username': 'kaspar_h',
                'email': 'kaspar@differential.network',
                'full_name': 'Kaspar Hauer',
                'headline': 'Astrophotographer & Dark Sky Sanctuary Advocate',
                'bio': 'Tracking interstellar nebulae and high-altitude glacial landscapes in the Atacama Desert. The universe is our only timeless sanctuary.',
                'location': 'San Pedro de Atacama, Chile',
                'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'connections_only',
                'is_verified': False,
                'interests': ['Astrophotography', 'Deep Sky Survey', 'Glaciology', 'Optics Engineering'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7q8w9e0r1t2y3u4i5o6p7a8s9d0f1g2h3j4k5l6z7x8c='
            },
            {
                'username': 'claire_chen',
                'email': 'claire@differential.network',
                'full_name': 'Claire Chen',
                'headline': 'Ceramist & Tea Ceremony Master',
                'bio': 'Working with unglazed wood-fired stoneware and ancient high-iron clay. Practicing stillness in a hyper-accelerated era.',
                'location': 'Kyoto / San Francisco',
                'avatar_url': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Ceramic Art', 'Chado Ceremony', 'Japanese Woodcraft', 'Minimal Living'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEm3n4b5v6c7x8z9a0s1d2f3g4h5j6k7l8q9w0e1r2t3y4='
            },
            {
                'username': 'demo_user',
                'email': 'demo@differential.network',
                'full_name': 'Alexander Sterling',
                'headline': 'Design Technologist & P2P Protocols Researcher',
                'bio': 'Investigating cryptographic sovereignty and sovereign human interactions. Building spaces that protect rather than exploit.',
                'location': 'San Francisco / Stockholm',
                'avatar_url': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Cryptographic Protocols', 'Typography', 'Brutalism', 'Decentralized Networks'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4a5s6d7f8g9h0j1k2l3z4x5c6v7b8n9m0q1w2e3r4t5y='
            },
            {
                'username': 'host_user',
                'email': 'host@differential.network',
                'full_name': 'Host (You)',
                'headline': 'Node Operator & Sovereign Host',
                'bio': 'Hosting an encrypted zero-knowledge peer-to-peer sanctuary node. Connected directly via WebRTC data channels.',
                'location': 'Local Node',
                'avatar_url': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Cryptographic Protocols', 'Decentralized Networks', 'WebRTC', 'Medium Format'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4a5s6d7f8g9h0j1k2l3z4x5c6v7b8n9m0q1w2e3r4t5y='
            },
            {
                'username': 'friend_user',
                'email': 'friend@differential.network',
                'full_name': 'Friend (Guest)',
                'headline': 'Visiting Peer & Co-Creator',
                'bio': 'Collaborating over peer-to-peer encrypted channels. No algorithms, no surveillance.',
                'location': 'Remote Node',
                'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
                'banner_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
                'privacy_mode': 'public',
                'is_verified': True,
                'interests': ['Visual Arts', 'Modular Synthesizers', 'Philosophy of Mind'],
                'e2ee_public_key': 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEn5x7K9p2m3v4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0='
            }
        ]

        created_users = {}
        for u in users_data:
            user = User(
                username=u['username'],
                email=u['email'],
                password_hash=default_pwd,
                full_name=u['full_name'],
                headline=u['headline'],
                bio=u['bio'],
                location=u['location'],
                avatar_url=u['avatar_url'],
                banner_url=u['banner_url'],
                privacy_mode=u['privacy_mode'],
                is_verified=u['is_verified'],
                onboarding_completed=True,
                e2ee_public_key=u['e2ee_public_key']
            )
            db.session.add(user)
            db.session.flush()

            for tag in u['interests']:
                db.session.add(UserInterest(user_id=user.id, tag=tag))

            created_users[u['username']] = user

        # Image-only posts with mandatory alt-text and rich aesthetic descriptions
        posts_data = [
            {
                'username': 'elena_v',
                'image_url': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
                'thumbnail_url': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=75',
                'caption': 'Intersecting geometries in cast concrete. Captured at dawn before the city wakes.',
                'alt_text': 'Monochrome high-contrast architectural photograph showing soaring concrete cantilever slabs bathed in dawn shadows.',
                'aspect_ratio': '4:5',
                'privacy_level': 'public',
                'time_delta_hours': 3
            },
            {
                'username': 'julian_k',
                'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85',
                'thumbnail_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=75',
                'caption': 'Patching an analog oscillator matrix for a 48-hour continuous generative cycle. No screens, pure voltage.',
                'alt_text': 'Close-up photograph of a vintage modular synthesizer rack with dark braided patch cables and warm amber indicator LEDs.',
                'aspect_ratio': '16:9',
                'privacy_level': 'public',
                'time_delta_hours': 7
            },
            {
                'username': 'soraya_m',
                'image_url': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1400&q=85',
                'thumbnail_url': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=75',
                'caption': 'Black marble and hammered brass monolith installed in the north cloister. Silence made tangible.',
                'alt_text': 'Minimalist art gallery scene featuring a polished obsidian column standing beside an oxidized brass hemisphere.',
                'aspect_ratio': '4:5',
                'privacy_level': 'public',
                'time_delta_hours': 14
            },
            {
                'username': 'kaspar_h',
                'image_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=85',
                'thumbnail_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=75',
                'caption': 'Carina Nebula survey over the high Atacama salt flats. Zero light pollution within 400 kilometers.',
                'alt_text': 'Deep space astrophotography depicting vivid indigo and magenta cosmic gas clouds against an endless field of pinpoint stars.',
                'aspect_ratio': '1:1',
                'privacy_level': 'public',
                'time_delta_hours': 22
            },
            {
                'username': 'claire_chen',
                'image_url': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=85',
                'thumbnail_url': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=75',
                'caption': 'Wood-fired Shino glazed chawan bowl, cooling slowly after 72 hours in the anagama kiln.',
                'alt_text': 'Artistic still life of a handcrafted ceramic tea bowl with cracked snow-white glaze resting on weathered cedar wood.',
                'aspect_ratio': '4:5',
                'privacy_level': 'public',
                'time_delta_hours': 36
            },
            {
                'username': 'demo_user',
                'image_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=85',
                'thumbnail_url': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=75',
                'caption': 'The typography of quiet rebellion. Hand-printed letterpress proofs on 350gsm handmade cotton rag.',
                'alt_text': 'Overhead photographic composition showing metal lead type blocks and black ink impression proofs on textured cream paper.',
                'aspect_ratio': '16:9',
                'privacy_level': 'public',
                'time_delta_hours': 48
            }
        ]

        created_posts = []
        for p in posts_data:
            author = created_users[p['username']]
            post = Post(
                user_id=author.id,
                image_url=p['image_url'],
                thumbnail_url=p['thumbnail_url'],
                caption=p['caption'],
                alt_text=p['alt_text'],
                aspect_ratio=p['aspect_ratio'],
                privacy_level=p['privacy_level'],
                created_at=now - timedelta(hours=p['time_delta_hours'])
            )
            db.session.add(post)
            created_posts.append(post)

        db.session.flush()

        # Add some initial likes and comments
        demo_u = created_users['demo_user']
        elena_u = created_users['elena_v']
        julian_u = created_users['julian_k']
        soraya_u = created_users['soraya_m']

        # Elena's post likes & comments
        db.session.add(PostLike(post_id=created_posts[0].id, user_id=demo_u.id))
        db.session.add(PostLike(post_id=created_posts[0].id, user_id=julian_u.id))
        db.session.add(PostLike(post_id=created_posts[0].id, user_id=soraya_u.id))
        db.session.add(PostComment(
            post_id=created_posts[0].id,
            user_id=soraya_u.id,
            content="The texture on the lower overhang is sublime. Is this 400TX?"
        ))
        db.session.add(PostComment(
            post_id=created_posts[0].id,
            user_id=elena_u.id,
            content="Yes, pushed one stop in Rodinal 1:50. Thank you Soraya."
        ))

        # Julian's synth post
        db.session.add(PostLike(post_id=created_posts[1].id, user_id=demo_u.id))
        db.session.add(PostLike(post_id=created_posts[1].id, user_id=elena_u.id))
        db.session.add(PostComment(
            post_id=created_posts[1].id,
            user_id=demo_u.id,
            content="Intriguing routing. Are you using Buchla LPG gates for the envelope?"
        ))

        # Setup Connections for Demo User
        # 1. Mutual Connection: Demo User <-> Elena Rostova (Accepted, ready for P2P encrypted chat!)
        conn1 = Connection(
            requester_id=elena_u.id,
            addressee_id=demo_u.id,
            status='accepted',
            note="Admired your thoughts on architectural minimalism.",
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=1)
        )
        db.session.add(conn1)

        # 2. Mutual Connection: Demo User <-> Julian Vance (Accepted)
        conn2 = Connection(
            requester_id=demo_u.id,
            addressee_id=julian_u.id,
            status='accepted',
            note="Excited to discuss cryptographic signaling and sound design.",
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=3)
        )
        db.session.add(conn2)

        # 3. Pending Incoming Request: Soraya Mir -> Demo User
        conn3 = Connection(
            requester_id=soraya_u.id,
            addressee_id=demo_u.id,
            status='pending',
            note="Would love to exchange curatorial notes on privacy-preserving digital sanctuaries.",
            created_at=now - timedelta(hours=5)
        )
        db.session.add(conn3)

        # Add Notifications for Demo User
        notif1 = Notification(
            user_id=demo_u.id,
            actor_id=soraya_u.id,
            type='connection_request',
            entity_id=conn3.id,
            message="Soraya Mir requested to connect with you.",
            is_read=False,
            created_at=now - timedelta(hours=5)
        )
        notif2 = Notification(
            user_id=demo_u.id,
            actor_id=elena_u.id,
            type='connection_accepted',
            entity_id=conn1.id,
            message="Elena Rostova confirmed your mutual connection.",
            is_read=True,
            created_at=now - timedelta(days=1)
        )
        notif3 = Notification(
            user_id=demo_u.id,
            actor_id=julian_u.id,
            type='post_like',
            entity_id=created_posts[5].id,
            message="Julian Vance appreciated your photograph.",
            is_read=False,
            created_at=now - timedelta(hours=2)
        )

        host_u = created_users['host_user']
        friend_u = created_users['friend_user']

        conn_host_friend = Connection(
            requester_id=host_u.id,
            addressee_id=friend_u.id,
            status='accepted',
            note="Mutual peer connection for direct WebRTC P2P chat.",
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1)
        )
        db.session.add(conn_host_friend)

        db.session.add_all([notif1, notif2, notif3])
        db.session.commit()

        print("[OK] Database seeded successfully!")
        print("Demo Account 1 (Host):")
        print("  Email: host@differential.network  | Username: host_user   | Pass: Cipher@2026")
        print("Demo Account 2 (Friend):")
        print("  Email: friend@differential.network| Username: friend_user | Pass: Cipher@2026")
        print("Universal Sandbox Account:")
        print("  Email: demo@differential.network  | Username: demo_user   | Pass: Cipher@2026")

if __name__ == '__main__':
    seed_database()
