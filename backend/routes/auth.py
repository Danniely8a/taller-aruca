from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User, db
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if current_user.rol not in roles:
                return jsonify({'error': 'No tienes permiso para realizar esta acción'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(correo=data.get('correo')).first()
    if user and user.check_password(data.get('contrasena')) and user.activo:
        login_user(user)
        return jsonify({'user': user.to_dict(), 'message': 'Sesión iniciada correctamente'})
    return jsonify({'error': 'Credenciales inválidas o usuario inactivo'}), 401

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Sesión cerrada'})

@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    return jsonify({'user': current_user.to_dict()})
