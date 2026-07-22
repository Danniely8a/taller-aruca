from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User, PasswordResetCode, db
from functools import wraps
from datetime import datetime, timedelta
import os
import requests

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

def _send_whatsapp_code(phone, code):
    """Send verification code via Twilio WhatsApp API"""
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')

    if not account_sid or not auth_token:
        print(f'[DEV] Código de verificación para {phone}: {code}')
        return True

    to_number = f'whatsapp:{phone}'
    url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    data = {
        'From': from_number,
        'To': to_number,
        'Body': f'🔐 *Taller Aruca*\nTu código de verificación es: *{code}*\nVálido por 15 minutos.'
    }
    resp = requests.post(url, data=data, auth=(account_sid, auth_token))
    return resp.status_code == 201

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    telefono = data.get('telefono', '').strip()

    if not telefono:
        return jsonify({'error': 'El número de teléfono es requerido'}), 400

    user = User.query.filter_by(telefono=telefono, activo=True).first()
    if not user:
        return jsonify({'error': 'No se encontró usuario activo con ese teléfono'}), 404

    code = PasswordResetCode.generate_code()
    expires = datetime.utcnow() + timedelta(minutes=15)

    reset = PasswordResetCode(user_id=user.id, code=code, expires_at=expires)
    db.session.add(reset)
    db.session.commit()

    sent = _send_whatsapp_code(telefono, code)
    if not sent:
        return jsonify({'error': 'Error al enviar el código. Intenta de nuevo.'}), 500

    return jsonify({'message': 'Código enviado por WhatsApp', 'debug_code': code if not os.getenv('TWILIO_ACCOUNT_SID') else None})

@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.get_json()
    telefono = data.get('telefono', '').strip()
    code = data.get('codigo', '').strip()
    nueva = data.get('nueva_contrasena', '')

    if not telefono or not code or not nueva:
        return jsonify({'error': 'Teléfono, código y nueva contraseña son requeridos'}), 400
    if len(nueva) < 4:
        return jsonify({'error': 'La contraseña debe tener al menos 4 caracteres'}), 400

    user = User.query.filter_by(telefono=telefono, activo=True).first()
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    reset = PasswordResetCode.query.filter_by(
        user_id=user.id, code=code, used=False
    ).order_by(PasswordResetCode.id.desc()).first()

    if not reset:
        return jsonify({'error': 'Código inválido'}), 400
    if reset.expires_at < datetime.utcnow():
        return jsonify({'error': 'El código ha expirado. Solicita uno nuevo.'}), 400

    reset.used = True
    user.set_password(nueva)
    db.session.commit()

    return jsonify({'message': 'Contraseña restablecida correctamente'})
