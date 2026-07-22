from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User, db
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__)

PREGUNTAS_SEGURIDAD = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es tu color favorito?',
    '¿Cuál es tu comida favorita?',
    '¿Cómo se llama tu mejor amigo de la infancia?',
    '¿Cuál es tu equipo de fútbol favorito?',
]

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

@auth_bp.route('/preguntas-seguridad', methods=['GET'])
def preguntas_seguridad():
    return jsonify({'preguntas': PREGUNTAS_SEGURIDAD})

@auth_bp.route('/change-password', methods=['PUT'])
@login_required
def change_password():
    data = request.get_json()
    current = data.get('contrasena_actual')
    nueva = data.get('nueva_contrasena')

    if not current or not nueva:
        return jsonify({'error': 'Contraseña actual y nueva contraseña son requeridas'}), 400
    if len(nueva) < 4:
        return jsonify({'error': 'La nueva contraseña debe tener al menos 4 caracteres'}), 400
    if not current_user.check_password(current):
        return jsonify({'error': 'La contraseña actual es incorrecta'}), 400

    current_user.set_password(nueva)
    db.session.commit()
    return jsonify({'message': 'Contraseña actualizada correctamente'})

@auth_bp.route('/reset-password-admin', methods=['PUT'])
@role_required('Gerente General')
def reset_password_admin():
    data = request.get_json()
    user_id = data.get('user_id')
    nueva = data.get('nueva_contrasena')

    if not user_id or not nueva:
        return jsonify({'error': 'user_id y nueva contraseña son requeridos'}), 400
    if len(nueva) < 4:
        return jsonify({'error': 'La contraseña debe tener al menos 4 caracteres'}), 400

    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    user.set_password(nueva)
    db.session.commit()
    return jsonify({'message': f'Contraseña de {user.nombre} actualizada correctamente'})

@auth_bp.route('/check-pregunta', methods=['POST'])
def check_pregunta():
    data = request.get_json()
    correo = data.get('correo', '').strip()

    if not correo:
        return jsonify({'error': 'El correo es requerido'}), 400

    user = User.query.filter_by(correo=correo, activo=True).first()
    if not user:
        return jsonify({'error': 'No se encontró usuario activo con ese correo'}), 404
    if not user.pregunta_seguridad:
        return jsonify({'error': 'Este usuario no tiene pregunta de seguridad configurada. Contacta al administrador.'}), 400

    return jsonify({'pregunta': user.pregunta_seguridad})

@auth_bp.route('/recover-password', methods=['POST'])
def recover_password():
    data = request.get_json()
    correo = data.get('correo', '').strip()
    respuesta = data.get('respuesta', '').strip()
    nueva = data.get('nueva_contrasena', '')

    if not correo or not respuesta or not nueva:
        return jsonify({'error': 'Correo, respuesta y nueva contraseña son requeridos'}), 400
    if len(nueva) < 4:
        return jsonify({'error': 'La contraseña debe tener al menos 4 caracteres'}), 400

    user = User.query.filter_by(correo=correo, activo=True).first()
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    if not user.check_respuesta_seguridad(respuesta):
        return jsonify({'error': 'La respuesta es incorrecta'}), 400

    user.set_password(nueva)
    db.session.commit()
    return jsonify({'message': 'Contraseña restablecida correctamente'})
