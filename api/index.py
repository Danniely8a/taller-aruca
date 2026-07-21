import sys
import os
import traceback

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)
os.chdir(backend_path)

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'API funcionando correctamente'})

@app.route('/api/debug', methods=['GET'])
def debug():
    try:
        from routes import (
            auth_bp, users_bp, clients_bp, equipments_bp,
            work_orders_bp, photos_bp, status_history_bp, qr_bp, payments_bp, notifications_bp,
            public_order_bp
        )
        from routes.pagos_semanales import pagos_semanales_bp
        return jsonify({'imports': 'ok'})
    except Exception as e:
        return jsonify({'error': str(e), 'trace': traceback.format_exc()})
