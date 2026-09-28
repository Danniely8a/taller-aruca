import os
import sys

from flask import Flask

app = Flask(__name__)


@app.route('/api/health')
def health():
    return {
        'status': 'ok',
        'python': sys.version,
        'vercel': os.getenv('VERCEL'),
        'has_db': bool(os.getenv('DATABASE_URL')),
        'cwd': os.getcwd(),
        'files': sorted(os.listdir(os.getcwd()))[:30],
    }


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path=''):
    return 'Taller Aruca - funcion basica OK', 200, {'Content-Type': 'text/plain; charset=utf-8'}
