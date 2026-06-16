from flask import Blueprint, request, jsonify
from models.status_history import StatusHistory
from .auth import role_required

status_history_bp = Blueprint('status_history', __name__)

@status_history_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_history(order_id):
    history = StatusHistory.query.filter_by(orden_trabajo_id=order_id)\
        .order_by(StatusHistory.fecha_cambio.desc()).all()
    return jsonify([h.to_dict() for h in history])
