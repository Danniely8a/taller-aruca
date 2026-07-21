from flask import Blueprint, request, jsonify
from models.client import Client, db
from .auth import role_required

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def get_clients():
    clients = Client.query.all()
    return jsonify([c.to_dict() for c in clients])

@clients_bp.route('/<int:id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def get_client(id):
    client = Client.query.get_or_404(id)
    return jsonify(client.to_dict())

@clients_bp.route('/', methods=['POST'])
@role_required('Gerente General', 'Recepción / Ventas')
def create_client():
    data = request.get_json()
    client = Client(
        cedula_rif=data.get('cedula_rif', ''),
        nombre=data['nombre'],
        telefono=data['telefono'],
        empresa=data.get('empresa', ''),
        correo=data.get('correo', '')
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client.to_dict()), 201

@clients_bp.route('/<int:id>', methods=['PUT'])
@role_required('Gerente General', 'Recepción / Ventas')
def update_client(id):
    client = Client.query.get_or_404(id)
    data = request.get_json()
    client.cedula_rif = data.get('cedula_rif', client.cedula_rif)
    client.nombre = data.get('nombre', client.nombre)
    client.telefono = data.get('telefono', client.telefono)
    client.empresa = data.get('empresa', client.empresa)
    client.correo = data.get('correo', client.correo)
    db.session.commit()
    return jsonify(client.to_dict())

@clients_bp.route('/<int:id>', methods=['DELETE'])
@role_required('Gerente General')
def delete_client(id):
    client = Client.query.get_or_404(id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({'message': 'Cliente eliminado'})
