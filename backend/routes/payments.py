from flask import Blueprint, request, jsonify, redirect
from models.payment import Payment, db
from models.work_order import WorkOrder
from .auth import role_required
import os
import uuid

payments_bp = Blueprint('payments', __name__)

BUCKET = 'fotos'
LOCAL_FOLDER = os.path.join('/tmp', 'uploads') if os.getenv('VERCEL') else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(LOCAL_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'}
CONTENT_TYPES = {
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _try_storage():
    try:
        from supabase_storage import upload_to_storage, delete_from_storage, get_public_url, download_file
        return upload_to_storage, delete_from_storage, get_public_url, download_file
    except:
        return None, None, None, None

@payments_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_payments(order_id):
    payments = Payment.query.filter_by(orden_trabajo_id=order_id).order_by(Payment.fecha_pago.desc()).all()
    total = sum(p.monto for p in payments)
    result = []
    _, _, get_public_url, _ = _try_storage()
    for p in payments:
        d = p.to_dict()
        if d.get('comprobante_ruta'):
            if get_public_url:
                d['comprobante_url'] = get_public_url(BUCKET, d['comprobante_ruta'])
            else:
                d['comprobante_url'] = f'/api/photos/uploads/{d["comprobante_ruta"]}'
        result.append(d)
    return jsonify({'pagos': result, 'total_pagado': total})

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
            comprobante_filename = f"pagos/{order_id}/{uuid.uuid4().hex}.{ext}"
            file_bytes = file.read()
            content_type = CONTENT_TYPES.get(ext, 'application/pdf')
            upload_to_storage, _, _, _ = _try_storage()
            if upload_to_storage:
                try:
                    upload_to_storage(BUCKET, comprobante_filename, file_bytes, content_type)
                except Exception as e:
                    return jsonify({'error': f'Error al subir comprobante: {str(e)}'}), 500
            else:
                filepath = os.path.join(LOCAL_FOLDER, comprobante_filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, 'wb') as f:
                    f.write(file_bytes)

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
        _, delete_from_storage, _, _ = _try_storage()
        if delete_from_storage:
            try:
                delete_from_storage(BUCKET, payment.comprobante_ruta)
            except:
                pass
    db.session.delete(payment)
    db.session.commit()
    return jsonify({'message': 'Pago eliminado'})
