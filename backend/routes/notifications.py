from flask import Blueprint, request, jsonify
from models.notification import Notification, db
from models.user import User
from .auth import role_required

notifications_bp = Blueprint('notifications', __name__)

def crear_notificacion(usuario_id, titulo, mensaje, tipo, orden_id=None):
    notif = Notification(
        usuario_id=usuario_id,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        orden_trabajo_id=orden_id
    )
    db.session.add(notif)
    db.session.commit()
    return notif

@notifications_bp.route('/', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_notifications():
    from flask_login import current_user
    notifs = Notification.query.filter_by(usuario_id=current_user.id).order_by(Notification.fecha_creacion.desc()).limit(50).all()
    no_leidas = Notification.query.filter_by(usuario_id=current_user.id, leida=False).count()
    return jsonify({'notifications': [n.to_dict() for n in notifs], 'no_leidas': no_leidas})

@notifications_bp.route('/read-all', methods=['PUT'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def mark_all_read():
    from flask_login import current_user
    Notification.query.filter_by(usuario_id=current_user.id, leida=False).update({'leida': True})
    db.session.commit()
    return jsonify({'message': 'Todas las notificaciones marcadas como leídas'})

@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def mark_read(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    notif.leida = True
    db.session.commit()
    return jsonify(notif.to_dict())
