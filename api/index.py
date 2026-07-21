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

@app.route('/api/debug-imports', methods=['GET'])
def debug_imports():
    results = {}
    try:
        from flask_cors import CORS
        results['flask_cors'] = 'ok'
    except Exception as e:
        results['flask_cors'] = str(e)
    try:
        from flask_login import LoginManager
        results['flask_login'] = 'ok'
    except Exception as e:
        results['flask_login'] = str(e)
    try:
        from models.user import db, bcrypt, User
        results['models.user'] = 'ok'
    except Exception as e:
        results['models.user'] = str(e)
    try:
        from routes.auth import auth_bp
        results['routes.auth'] = 'ok'
    except Exception as e:
        results['routes.auth'] = str(e)
    try:
        from routes.work_orders import work_orders_bp
        results['routes.work_orders'] = 'ok'
    except Exception as e:
        results['routes.work_orders'] = str(e)
    try:
        from routes.qr import qr_bp
        results['routes.qr'] = 'ok'
    except Exception as e:
        results['routes.qr'] = str(e)
    try:
        from routes.photos import photos_bp
        results['routes.photos'] = 'ok'
    except Exception as e:
        results['routes.photos'] = str(e)
    try:
        from routes.payments import payments_bp
        results['routes.payments'] = 'ok'
    except Exception as e:
        results['routes.payments'] = str(e)
    try:
        from routes.notifications import notifications_bp
        results['routes.notifications'] = 'ok'
    except Exception as e:
        results['routes.notifications'] = str(e)
    try:
        from routes.public_order import public_order_bp
        results['routes.public_order'] = 'ok'
    except Exception as e:
        results['routes.public_order'] = str(e)
    try:
        from routes.pagos_semanales import pagos_semanales_bp
        results['routes.pagos_semanales'] = 'ok'
    except Exception as e:
        results['routes.pagos_semanales'] = str(e)
    try:
        from routes.clients import clients_bp
        results['routes.clients'] = 'ok'
    except Exception as e:
        results['routes.clients'] = str(e)
    try:
        from routes.equipments import equipments_bp
        results['routes.equipments'] = 'ok'
    except Exception as e:
        results['routes.equipments'] = str(e)
    try:
        from routes.users import users_bp
        results['routes.users'] = 'ok'
    except Exception as e:
        results['routes.users'] = str(e)
    try:
        from routes.status_history import status_history_bp
        results['routes.status_history'] = 'ok'
    except Exception as e:
        results['routes.status_history'] = str(e)
    return jsonify(results)
