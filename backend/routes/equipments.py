from flask import Blueprint, request, jsonify
from models.equipment import Equipment, db
from .auth import role_required

equipments_bp = Blueprint('equipments', __name__)

@equipments_bp.route('/', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_equipments():
    equipments = Equipment.query.all()
    return jsonify([e.to_dict() for e in equipments])

@equipments_bp.route('/<int:id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_equipment(id):
    equip = Equipment.query.get_or_404(id)
    return jsonify(equip.to_dict())

@equipments_bp.route('/', methods=['POST'])
@role_required('Recepción / Ventas')
def create_equipment():
    data = request.get_json()
    equip = Equipment(
        cliente_id=data['cliente_id'],
        tipo_equipo=data['tipo_equipo'],
        marca=data['marca'],
        modelo=data['modelo'],
        numero_serie=data.get('numero_serie', '')
    )
    db.session.add(equip)
    db.session.commit()
    return jsonify(equip.to_dict()), 201

@equipments_bp.route('/<int:id>', methods=['PUT'])
@role_required('Recepción / Ventas')
def update_equipment(id):
    equip = Equipment.query.get_or_404(id)
    data = request.get_json()
    equip.tipo_equipo = data.get('tipo_equipo', equip.tipo_equipo)
    equip.marca = data.get('marca', equip.marca)
    equip.modelo = data.get('modelo', equip.modelo)
    equip.numero_serie = data.get('numero_serie', equip.numero_serie)
    db.session.commit()
    return jsonify(equip.to_dict())

@equipments_bp.route('/<int:id>', methods=['DELETE'])
@role_required('Gerente General')
def delete_equipment(id):
    equip = Equipment.query.get_or_404(id)
    db.session.delete(equip)
    db.session.commit()
    return jsonify({'message': 'Equipo eliminado'})
