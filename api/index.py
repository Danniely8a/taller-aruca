from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'API funcionando correctamente'})

@app.route('/api/debug', methods=['GET'])
def debug():
    return jsonify({
        'vercel': os.getenv('VERCEL'),
        'database_url': bool(os.getenv('DATABASE_URL')),
        'secret_key': bool(os.getenv('SECRET_KEY')),
        'cwd': os.getcwd(),
    })
