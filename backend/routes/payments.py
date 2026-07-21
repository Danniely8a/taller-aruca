from flask import Blueprint, request, jsonify, send_from_directory
from models.payment import Payment, db
from models.work_order import WorkOrder
from .auth import role_required
import os
import uuid

payments_bp = Blueprint('payments', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@payments_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_payments(order_id):
    payments = Payment.query.filter_by(orden_trabajo_id=order_id).order_by(Payment.fecha_pago.desc()).all()
    total = sum(p.monto for p in payments)
    return jsonify({'pagos': [p.to_dict() for p in payments], 'total_pagado': total})

@payments_bp.route('/<int:order_id>', methods=['POST'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def create_payment(order_id):
    order = WorkOrder.query.get_or_404(order_id)

    monto = request.form.get('monto')
    descripcion = request.form.get('descripcion', '')

    if not monto:
        return jsonify({'error': 'El monto es requerido'}), 400

    comprobante_filename = None
    if 'comprobante' in request.files:
        file = request.files['comprobante']
        if file.filename and file.filename != '' and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            comprobante_filename = f"pago_{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(UPLOAD_FOLDER, comprobante_filename)
            file.save(filepath)

    payment = Payment(
        orden_trabajo_id=order_id,
        monto=float(monto),
        descripcion=descripcion,
        comprobante_ruta=comprobante_filename,
        usuario_id=request.form.get('usuario_id', type=int)
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify(payment.to_dict()), 201

@payments_bp.route('/<int:payment_id>', methods=['DELETE'])
@role_required('Gerente General')
def delete_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    if payment.comprobante_ruta:
        path = os.path.join(UPLOAD_FOLDER, payment.comprobante_ruta)
        if os.path.exists(path):
            os.remove(path)
    db.session.delete(payment)
    db.session.commit()
    return jsonify({'message': 'Pago eliminado'})
