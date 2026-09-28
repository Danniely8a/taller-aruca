import traceback
import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from vercel_app import app
except Exception:
    tb = traceback.format_exc()
    diag = [
        f"python={sys.version}",
        f"file={__file__}",
        f"cwd={os.getcwd()}",
        f"backend_path={backend_path}",
        f"backend_exists={os.path.isdir(backend_path)}",
        f"sys.path={sys.path[:5]}",
        f"vercel_env={os.getenv('VERCEL')}",
        f"has_db_url={bool(os.getenv('DATABASE_URL'))}",
        "",
        tb,
    ]
    if os.path.isdir(backend_path):
        try:
            diag.append("backend_ls=" + ", ".join(sorted(os.listdir(backend_path))[:40]))
        except Exception as e:
            diag.append(f"backend_ls_error={e}")
    body = "\n".join(diag)
    try:
        from flask import Flask
        app = Flask(__name__)

        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def _diag(path=''):
            return body, 500, {'Content-Type': 'text/plain; charset=utf-8'}
    except Exception:
        def app(environ, start_response):
            start_response('500 Internal Server Error', [('Content-Type', 'text/plain; charset=utf-8')])
            return [body.encode('utf-8')]
