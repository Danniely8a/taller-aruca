from flask import Blueprint, request, jsonify
from models.user import User, db
from .auth import role_required, PREGUNTAS_SEGURIDAD
from flask_login import login_required

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@role_required('Gerente General')
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@users_bp.route('/setup-preguntas', methods=['POST'])
@role_required('Gerente General')
def setup_preguntas_bulk():
    """Assign default security questions to all users without one"""
    data = request.get_json() or {}
    pregunta_default = data.get('pregunta', PREGUNTAS_SEGURIDAD[0])
    respuesta_default = data.get('respuesta', 'aruca2026')

    users_without = User.query.filter(User.pregunta_seguridad.is_(None)).all()
    count = 0
    for user in users_without:
        user.pregunta_seguridad = pregunta_default
        user.set_respuesta_seguridad(respuesta_default)
        count += 1
    db.session.commit()
    return jsonify({'message': f'{count} usuarios configurados', 'pregunta': pregunta_default, 'respuesta': respuesta_default})

@users_bp.route('/', methods=['POST'])
@role_required('Gerente General')
def create_user():
    data = request.get_json()
    if User.query.filter_by(correo=data['correo']).first():
        return jsonify({'error': 'El correo ya está registrado'}), 400
    user = User(
        nombre=data['nombre'],
        correo=data['correo'],
        telefono=data.get('telefono', ''),
        pregunta_seguridad=data.get('pregunta_seguridad', ''),
        rol=data['rol'],
        permisos=data.get('permisos', ''),
        activo=data.get('activo', True)
    )
    user.set_password(data['contrasena'])
    if data.get('respuesta_seguridad'):
        user.set_respuesta_seguridad(data['respuesta_seguridad'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@users_bp.route('/<int:id>', methods=['PUT'])
@role_required('Gerente General')
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    user.nombre = data.get('nombre', user.nombre)
    user.correo = data.get('correo', user.correo)
    user.telefono = data.get('telefono', user.telefono)
    user.pregunta_seguridad = data.get('pregunta_seguridad', user.pregunta_seguridad)
    user.rol = data.get('rol', user.rol)
    user.permisos = data.get('permisos', user.permisos)
    user.activo = data.get('activo', user.activo)
    if data.get('contrasena'):
        user.set_password(data['contrasena'])
    if data.get('respuesta_seguridad'):
        user.set_respuesta_seguridad(data['respuesta_seguridad'])
    db.session.commit()
    return jsonify(user.to_dict())

@users_bp.route('/<int:id>', methods=['DELETE'])
@role_required('Gerente General')
def delete_user(id):
    user = User.query.get_or_404(id)
    user.activo = False
    db.session.commit()
    return jsonify({'message': 'Usuario desactivado'})
