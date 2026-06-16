from flask import Blueprint, request, jsonify
from models.work_order import WorkOrder, db
from models.status_history import StatusHistory
from models.client import Client
from models.equipment import Equipment
from .auth import role_required
from datetime import datetime

work_orders_bp = Blueprint('work_orders', __name__)

ESTADOS = [
    'Recibido', 'En Diagnóstico', 'Esperando Presupuesto',
    'Esperando Aprobación', 'Esperando Repuestos', 'En Reparación',
    'Listo para Entrega', 'Entregado'
]

def generar_numero_ot():
    ultima = WorkOrder.query.order_by(WorkOrder.id.desc()).first()
    if ultima:
        num = int(ultima.numero_ot.replace('OT', '')) + 1
    else:
        num = 1
    return f'OT{num:04d}'

def generar_codigo_corto():
    ultima = WorkOrder.query.order_by(WorkOrder.id.desc()).first()
    if ultima:
        num = int(ultima.codigo_corto.replace('R', '')) + 1
    else:
        num = 1
    return f'R{num:03d}'

@work_orders_bp.route('/', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_work_orders():
    estado = request.args.get('estado')
    query = WorkOrder.query
    if estado:
        query = query.filter_by(estado=estado)
    orders = query.order_by(WorkOrder.fecha_ingreso.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@work_orders_bp.route('/<int:id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_work_order(id):
    order = WorkOrder.query.get_or_404(id)
    return jsonify(order.to_dict())

@work_orders_bp.route('/', methods=['POST'])
@role_required('Recepción / Ventas')
def create_work_order():
    data = request.get_json()
    order = WorkOrder(
        numero_ot=generar_numero_ot(),
        codigo_corto=generar_codigo_corto(),
        cliente_id=data['cliente_id'],
        equipo_id=data['equipo_id'],
        estado='Recibido',
        prioridad=data.get('prioridad', 'Normal'),
        falla_reportada=data.get('falla_reportada', ''),
        usuario_recepcion=data['usuario_recepcion']
    )
    db.session.add(order)
    db.session.flush()

    history = StatusHistory(
        orden_trabajo_id=order.id,
        estado_anterior=None,
        nuevo_estado='Recibido',
        usuario_id=data['usuario_recepcion']
    )
    db.session.add(history)
    db.session.commit()
    return jsonify(order.to_dict()), 201

@work_orders_bp.route('/recepcion', methods=['POST'])
@role_required('Recepción / Ventas')
def recepcion_completa():
    data = request.get_json()

    client = Client.query.filter_by(telefono=data['telefono']).first()
    if not client:
        client = Client(
            nombre=data['nombre_cliente'],
            telefono=data['telefono'],
            empresa=data.get('empresa', ''),
            correo=data.get('correo', '')
        )
        db.session.add(client)
        db.session.flush()
    else:
        client.nombre = data['nombre_cliente']
        client.empresa = data.get('empresa', client.empresa)
        client.correo = data.get('correo', client.correo)
        db.session.flush()

    equip = Equipment(
        cliente_id=client.id,
        tipo_equipo=data['tipo_equipo'],
        marca=data['marca'],
        modelo=data['modelo'],
        numero_serie=data.get('numero_serie', '')
    )
    db.session.add(equip)
    db.session.flush()

    order = WorkOrder(
        numero_ot=generar_numero_ot(),
        codigo_corto=generar_codigo_corto(),
        cliente_id=client.id,
        equipo_id=equip.id,
        estado='Recibido',
        prioridad=data.get('prioridad', 'Normal'),
        falla_reportada=data.get('falla_reportada', ''),
        usuario_recepcion=data['usuario_recepcion']
    )
    db.session.add(order)
    db.session.flush()

    history = StatusHistory(
        orden_trabajo_id=order.id,
        estado_anterior=None,
        nuevo_estado='Recibido',
        usuario_id=data['usuario_recepcion']
    )
    db.session.add(history)
    db.session.commit()

    return jsonify(order.to_dict()), 201

@work_orders_bp.route('/<int:id>/estado', methods=['PUT'])
@role_required('Gerente General', 'Supervisor')
def update_estado(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    nuevo_estado = data['nuevo_estado']
    if nuevo_estado not in ESTADOS:
        return jsonify({'error': 'Estado no válido'}), 400

    estado_anterior = order.estado
    order.estado = nuevo_estado

    history = StatusHistory(
        orden_trabajo_id=order.id,
        estado_anterior=estado_anterior,
        nuevo_estado=nuevo_estado,
        usuario_id=data['usuario_id']
    )
    db.session.add(history)
    db.session.commit()
    return jsonify(order.to_dict())

@work_orders_bp.route('/<int:id>', methods=['PUT'])
@role_required('Recepción / Ventas')
def update_work_order(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    order.prioridad = data.get('prioridad', order.prioridad)
    order.falla_reportada = data.get('falla_reportada', order.falla_reportada)
    db.session.commit()
    return jsonify(order.to_dict())

@work_orders_bp.route('/estados', methods=['GET'])
def get_estados():
    return jsonify(ESTADOS)
