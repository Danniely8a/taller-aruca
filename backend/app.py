import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager
from models.user import db, bcrypt, User
from routes import (
    auth_bp, users_bp, clients_bp, equipments_bp,
    work_orders_bp, photos_bp, status_history_bp, qr_bp, payments_bp, notifications_bp,
    public_order_bp
)
from routes.pagos_semanales import pagos_semanales_bp

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
basedir = os.path.abspath(os.path.dirname(__file__))

database_url = os.getenv('DATABASE_URL')
if database_url and 'postgres' in database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'taller_maquinas.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

db.init_app(app)
bcrypt.init_app(app)
CORS(app, supports_credentials=True)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

def seed_initial_data():
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
        print("OK: Usuarios iniciales creados (contrasena: 123456)")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_initial_data()
    app.run(debug=True, host='0.0.0.0', port=8080)
