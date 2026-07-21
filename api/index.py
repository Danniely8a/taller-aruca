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
    results = {}
    modules = [
        ('flask_cors', 'flask_cors'),
        ('flask_login', 'flask_login'),
        ('flask_sqlalchemy', 'flask_sqlalchemy'),
        ('bcrypt', 'bcrypt'),
        ('psycopg2', 'psycopg2'),
        ('qrcode', 'qrcode'),
        ('PIL', 'PIL'),
        ('werkzeug', 'werkzeug'),
    ]
    for name, mod in modules:
        try:
            __import__(mod)
            results[name] = 'ok'
        except Exception as e:
            results[name] = str(e)

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

    return jsonify(results)
