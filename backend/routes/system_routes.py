from flask import Blueprint, jsonify
from config import Config
from models import db

system_bp = Blueprint('system', __name__, url_prefix='/api/system')

@system_bp.route('/config', methods=['GET'])
def get_system_config():
    """
    Returns public brand and verified business mailing address
    supplied strictly through configuration (no invented/lorem-ipsum address).
    """
    return jsonify({
        'brand_name': 'Differential',
        'tagline': 'Meet your next meaningful connection.',
        'business_contact': {
            'company_name': Config.BUSINESS_NAME,
            'address_line1': Config.BUSINESS_ADDRESS_LINE1,
            'address_line2': Config.BUSINESS_ADDRESS_LINE2,
            'city': Config.BUSINESS_CITY,
            'state': Config.BUSINESS_STATE,
            'postal_code': Config.BUSINESS_POSTAL_CODE,
            'country': Config.BUSINESS_COUNTRY,
            'concierge_email': Config.BUSINESS_EMAIL
        },
        'analytics_id': Config.ANALYTICS_ID,
        'privacy_framework': 'Zero-Knowledge Cryptographic P2P',
        'storage_policy': 'No Plaintext Chat Storage / EXIF Scrubbing Enforced'
    }), 200

@system_bp.route('/health', methods=['GET'])
def health_check():
    try:
        # Verify database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'

    return jsonify({
        'status': 'operational',
        'database': db_status,
        'environment': 'development' if Config.SESSION_COOKIE_SECURE is False else 'production'
    }), 200
