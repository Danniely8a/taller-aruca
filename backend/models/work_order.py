from .user import db
from utils import now_ve
import json


class WorkOrder(db.Model):
    __tablename__ = 'work_orders'

    id = db.Column(db.Integer, primary_key=True)
    numero_ot = db.Column(db.String(20), unique=True, nullable=False)
    codigo_corto = db.Column(db.String(10), unique=True, nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    equipo_id = db.Column(db.Integer, db.ForeignKey('equipments.id'), nullable=False)
    estado = db.Column(db.String(50), nullable=False, default='Recibido')
    prioridad = db.Column(db.String(20), nullable=False, default='Normal')
    falla_reportada = db.Column(db.Text, nullable=True)
    notas_tecnicas = db.Column(db.Text, nullable=True)
    tipo_servicio = db.Column(db.String(50), nullable=False, default='Reparación')
    item_seleccionado = db.Column(db.Text, nullable=True)
    items_listos = db.Column(db.Text, nullable=True)
    items_validados = db.Column(db.Text, nullable=True)
    tecnico_asignado_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    fecha_ingreso = db.Column(db.DateTime, default=now_ve)
    usuario_recepcion = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    photo = db.relationship('Photo', backref='work_order', uselist=False, lazy=True)
    status_history = db.relationship('StatusHistory', backref='work_order', lazy=True)

    receiver = db.relationship('User', foreign_keys=[usuario_recepcion], backref='received_orders')
    tecnico_asignado = db.relationship('User', foreign_keys=[tecnico_asignado_id], backref='ordenes_asignadas')

    def to_dict(self):
        return {
            'id': self.id,
            'numero_ot': self.numero_ot,
            'codigo_corto': self.codigo_corto,
            'cliente_id': self.cliente_id,
            'equipo_id': self.equipo_id,
            'estado': self.estado,
            'prioridad': self.prioridad,
            'falla_reportada': self.falla_reportada,
            'notas_tecnicas': self.notas_tecnicas,
            'tipo_servicio': self.tipo_servicio,
            'item_seleccionado': json.loads(self.item_seleccionado) if self.item_seleccionado and self.item_seleccionado != '[]' else [],
            'items_listos': json.loads(self.items_listos) if self.items_listos and self.items_listos != '[]' else [],
            'items_validados': json.loads(self.items_validados) if self.items_validados and self.items_validados != '[]' else [],
            'fecha_ingreso': self.fecha_ingreso.isoformat() if self.fecha_ingreso else None,
            'usuario_recepcion': self.usuario_recepcion,
            'cliente': self.client.to_dict() if self.client else None,
            'equipo': self.equipment.to_dict() if self.equipment else None,
            'recepcionista': self.receiver.to_dict() if self.receiver else None,
            'tecnico_asignado': self.tecnico_asignado.to_dict() if self.tecnico_asignado else None,
            'tecnico_asignado_id': self.tecnico_asignado_id
        }
