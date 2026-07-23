import sys
import os
import traceback

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)
os.chdir(backend_path)

from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from models.user import db, bcrypt, User
from routes import (
    auth_bp, users_bp, clients_bp, equipments_bp,
    work_orders_bp, photos_bp, status_history_bp, qr_bp, payments_bp, notifications_bp,
    public_order_bp
)
from routes.pagos_semanales import pagos_semanales_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-aruca-2026')

database_url = os.getenv('DATABASE_URL')
if database_url:
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
    database_url = database_url.replace('%24', '$')
    if '?' in database_url:
        database_url += '&sslmode=require'
    else:
        database_url += '?sslmode=require'
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {'sslmode': 'require', 'connect_timeout': 10}
    }
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(backend_path, 'taller_maquinas.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True

db.init_app(app)
bcrypt.init_app(app)
CORS(app, supports_credentials=True)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(clients_bp, url_prefix='/api/clients')
app.register_blueprint(equipments_bp, url_prefix='/api/equipments')
app.register_blueprint(work_orders_bp, url_prefix='/api/work-orders')
app.register_blueprint(photos_bp, url_prefix='/api/photos')
app.register_blueprint(status_history_bp, url_prefix='/api/status-history')
app.register_blueprint(qr_bp, url_prefix='/api/qr')
app.register_blueprint(payments_bp, url_prefix='/api/payments')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(public_order_bp, url_prefix='/ver')
app.register_blueprint(pagos_semanales_bp, url_prefix='/api/pagos-semanales')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'API funcionando correctamente'})

try:
    with app.app_context():
        db.create_all()
        
        # Add missing columns if they don't exist
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        columns = [c['name'] for c in inspector.get_columns('users')]
        
        alter_statements = []
        if 'telefono' not in columns:
            alter_statements.append("ALTER TABLE users ADD COLUMN telefono VARCHAR(20)")
        if 'pregunta_seguridad' not in columns:
            alter_statements.append("ALTER TABLE users ADD COLUMN pregunta_seguridad VARCHAR(200)")
        if 'respuesta_seguridad' not in columns:
            alter_statements.append("ALTER TABLE users ADD COLUMN respuesta_seguridad VARCHAR(200)")
        
        for stmt in alter_statements:
            try:
                db.session.execute(text(stmt))
                db.session.commit()
                print(f"OK: {stmt}")
            except Exception as e:
                print(f"Skip: {stmt} -> {e}")
                db.session.rollback()
        
        if User.query.count() == 0:
            usuarios = [
                {'nombre': 'Alberto Bonetti', 'correo': 'alberto@aruca.com', 'rol': 'Gerente General'},
                {'nombre': 'Eduardo Reinosa', 'correo': 'eduardo@aruca.com', 'rol': 'Técnico'},
                {'nombre': 'Hernán Rojas', 'correo': 'hernan@aruca.com', 'rol': 'Supervisor'},
                {'nombre': 'Daniely Ochoa', 'correo': 'daniely@aruca.com', 'rol': 'Recepción / Ventas'},
                {'nombre': 'Carlos Perez', 'correo': 'carlos@gmail.com', 'rol': 'Técnico'},
                {'nombre': 'Genesis', 'correo': 'genesis@aruca.com', 'rol': 'Pagos'},
            ]
            for u in usuarios:
                user = User(nombre=u['nombre'], correo=u['correo'], rol=u['rol'])
                user.set_password('123456')
                db.session.add(user)
            db.session.commit()
except Exception as e:
    import traceback
    print(f"DB Init Error: {e}")
    traceback.print_exc()

@app.route('/api/debug-db', methods=['GET'])
def debug_db():
    try:
        with app.app_context():
            db.create_all()
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            columns = [c['name'] for c in inspector.get_columns('users')]
            alter_statements = []
            if 'telefono' not in columns:
                alter_statements.append("ALTER TABLE users ADD COLUMN telefono VARCHAR(20)")
            if 'pregunta_seguridad' not in columns:
                alter_statements.append("ALTER TABLE users ADD COLUMN pregunta_seguridad VARCHAR(200)")
            if 'respuesta_seguridad' not in columns:
                alter_statements.append("ALTER TABLE users ADD COLUMN respuesta_seguridad VARCHAR(200)")
            for stmt in alter_statements:
                try:
                    db.session.execute(text(stmt))
                    db.session.commit()
                except:
                    db.session.rollback()
            tables = inspector.get_table_names()
            user_count = User.query.count()
            return jsonify({'tables': tables, 'users': user_count, 'columns': columns})
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()})

@app.route('/api/seed', methods=['GET'])
def seed():
    try:
        with app.app_context():
            db.create_all()
            from sqlalchemy import text, inspect as sa_inspect
            inspector = sa_inspect(db.engine)
            columns = [c['name'] for c in inspector.get_columns('users')]
            for col, typ in [('telefono', 'VARCHAR(20)'), ('pregunta_seguridad', 'VARCHAR(200)'), ('respuesta_seguridad', 'VARCHAR(200)')]:
                if col not in columns:
                    try:
                        db.session.execute(text(f"ALTER TABLE users ADD COLUMN {col} {typ}"))
                        db.session.commit()
                    except:
                        db.session.rollback()
        # Crear bucket de Supabase Storage si no existe
        try:
            from supabase_storage import _get_config, _headers
            import requests as _req
            url, key = _get_config()
            if url and key:
                buckets_res = _req.get(f'{url}/storage/v1/bucket', headers=_headers())
                if buckets_res.status_code == 200:
                    bucket_names = [b['name'] for b in buckets_res.json()]
                    if 'fotos' not in bucket_names:
                        create_res = _req.post(f'{url}/storage/v1/bucket', headers={**_headers(), 'Content-Type': 'application/json'}, json={'id': 'fotos', 'public': True})
                        print(f"OK: Bucket create -> {create_res.status_code}")
                    else:
                        print("OK: Bucket 'fotos' ya existe")
        except Exception as e:
            print(f"Skip bucket: {e}")
        
        if User.query.count() == 0:
                usuarios = [
                    {'nombre': 'Alberto Bonetti', 'correo': 'alberto@aruca.com', 'rol': 'Gerente General'},
                    {'nombre': 'Eduardo Reinosa', 'correo': 'eduardo@aruca.com', 'rol': 'Técnico'},
                    {'nombre': 'Hernán Rojas', 'correo': 'hernan@aruca.com', 'rol': 'Supervisor'},
                    {'nombre': 'Daniely Ochoa', 'correo': 'daniely@aruca.com', 'rol': 'Recepción / Ventas'},
                    {'nombre': 'Carlos Perez', 'correo': 'carlos@gmail.com', 'rol': 'Técnico'},
                    {'nombre': 'Genesis', 'correo': 'genesis@aruca.com', 'rol': 'Pagos'},
                ]
                for u in usuarios:
                    user = User(nombre=u['nombre'], correo=u['correo'], rol=u['rol'])
                    user.set_password('123456')
                    db.session.add(user)
                db.session.commit()
                return jsonify({'message': 'Seed completo', 'users': User.query.count()})
            return jsonify({'message': 'Ya existen usuarios', 'users': User.query.count()})
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()})
