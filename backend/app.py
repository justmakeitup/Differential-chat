import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from config import Config
from models import db
from flask_migrate import Migrate
from signaling import socketio, init_signaling

migrate = Migrate()

# Import blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.post_routes import post_bp
import re
from routes.connection_routes import connection_bp
from routes.notification_routes import notification_bp
from routes.system_routes import system_bp
from routes.chat_routes import chat_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS with credentials for cookies and authorization headers
    CORS(
        app,
        resources={r"/api/*": {"origins": [re.compile(r".*")]}},
        supports_credentials=True,
        expose_headers=['Content-Type', 'Authorization']
    )

    # Initialize database
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(post_bp)
    app.register_blueprint(connection_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(chat_bp)

    # Ensure upload directories exist
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.THUMBNAIL_FOLDER, exist_ok=True)

    # Static route to safely serve user image uploads
    @app.route('/api/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({'error': 'Image file size exceeds the 8MB limit.'}), 413

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'The requested resource was not found on this server.'}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({'error': 'An internal cryptographic service error occurred.'}), 500

    # Initialize WebRTC signaling
    init_signaling(app)

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"[*] Differential Backend & Signaling Engine running on http://127.0.0.1:{port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
