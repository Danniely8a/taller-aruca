import os
import sys
import traceback

from flask import Flask

app = Flask(__name__)
REPORT = []


def _step(name, fn):
    try:
        fn()
        REPORT.append('OK ' + name)
    except BaseException:
        REPORT.append('FAIL ' + name + ': ' + traceback.format_exc())


@app.route('/api/health')
def health():
    del REPORT[:]
    backend = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
    _step('backend_exists=' + str(os.path.isdir(backend)), lambda: None)

    def s_path():
        sys.path.insert(0, backend)
        os.chdir(backend)
    _step('path-setup', s_path)
    _step('import-flask_cors', lambda: __import__('flask_cors'))
    _step('import-flask_login', lambda: __import__('flask_login'))
    _step('import-dotenv', lambda: __import__('dotenv'))
    _step('import-bcrypt', lambda: __import__('bcrypt'))
    _step('import-qrcode', lambda: __import__('qrcode'))
    _step('import-PIL', lambda: __import__('PIL'))
    _step('import-psycopg2', lambda: __import__('psycopg2'))
    _step('import-models.user', lambda: __import__('models.user'))
    _step('import-models.work_order', lambda: __import__('models.work_order'))
    _step('import-routes.auth', lambda: __import__('routes.auth'))
    _step('import-routes', lambda: __import__('routes'))
    _step('import-routes.pagos_semanales', lambda: __import__('routes.pagos_semanales'))
    _step('import-routes.qr', lambda: __import__('routes.qr'))
    _step('import-routes.public_order', lambda: __import__('routes.public_order'))

    def s_app():
        from models.user import db
        from flask import Flask as F
        a = F(__name__, static_folder=os.path.join(os.getcwd(), '..', 'frontend', 'dist'))
        a.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite://')
        db.init_app(a)
        with a.app_context():
            db.create_all()
    _step('db-init-create_all', s_app)

    return {
        'python': sys.version,
        'cwd': os.getcwd(),
        'steps': REPORT,
        'has_db': bool(os.getenv('DATABASE_URL')),
    }


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path=''):
    return 'diag disponible en /api/health', 200, {'Content-Type': 'text/plain; charset=utf-8'}
