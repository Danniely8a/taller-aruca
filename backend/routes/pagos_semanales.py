import json
from flask import Blueprint, request, jsonify
from flask_login import current_user
from models.work_order import WorkOrder
from models.pago_semanal import PagoSemanal
from models.user import User, db
from .auth import role_required
from datetime import datetime, timedelta

pagos_semanales_bp = Blueprint('pagos_semanales', __name__)

@pagos_semanales_bp.route('/', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Pagos', 'Técnico')
def get_pagos_semanales():
    pagos = PagoSemanal.query.order_by(PagoSemanal.semana_inicio.desc()).all()
    return jsonify([p.to_dict() for p in pagos])

@pagos_semanales_bp.route('/generar', methods=['POST'])
@role_required('Gerente General', 'Supervisor', 'Pagos', 'Técnico')
def generar_pago_semanal():
    data = request.get_json()
    semana_inicio = datetime.strptime(data['semana_inicio'], '%Y-%m-%d').date()
    semana_fin = semana_inicio + timedelta(days=6)

    existente = PagoSemanal.query.filter_by(semana_inicio=semana_inicio).first()
    if existente:
        return jsonify({'error': 'Ya existe un reporte para esta semana'}), 400

    carlos = User.query.filter_by(correo='carlos@gmail.com').first()
    if not carlos:
        return jsonify({'error': 'No se encontró al técnico de afilado'}), 400

    desde = datetime.combine(semana_inicio, datetime.min.time())
    hasta = datetime.combine(semana_fin, datetime.max.time())

    ordenes = WorkOrder.query.filter(
        WorkOrder.tecnico_asignado_id == carlos.id,
        WorkOrder.tipo_servicio == 'Afilado',
        WorkOrder.fecha_ingreso >= desde,
        WorkOrder.fecha_ingreso <= hasta
    ).all()

    total_items = {}
    total_cant = 0
    for o in ordenes:
        if o.items_validados:
            try:
                items_validados = json.loads(o.items_validados)
                for nombre in items_validados:
                    total_items[nombre] = total_items.get(nombre, 0) + 1
                    total_cant += 1
            except:
                pass

    pago = PagoSemanal(
        tecnico_id=carlos.id,
        semana_inicio=semana_inicio,
        semana_fin=semana_fin,
        total_ordenes=len(ordenes),
        total_items=json.dumps(total_items),
        total_cantidad=total_cant,
    )
    db.session.add(pago)
    db.session.commit()
    return jsonify(pago.to_dict()), 201

@pagos_semanales_bp.route('/<int:id>/validar', methods=['PUT'])
@role_required('Gerente General')
def validar_pago(id):
    pago = PagoSemanal.query.get_or_404(id)
    data = request.get_json()
    pago.validado = True
    pago.validado_por = current_user.id
    pago.fecha_validacion = datetime.utcnow()
    pago.observaciones = data.get('observaciones', '')
    db.session.commit()
    return jsonify(pago.to_dict())

@pagos_semanales_bp.route('/<int:id>', methods=['DELETE'])
@role_required('Gerente General')
def delete_pago(id):
    pago = PagoSemanal.query.get_or_404(id)
    db.session.delete(pago)
    db.session.commit()
    return jsonify({'message': 'Eliminado'})
