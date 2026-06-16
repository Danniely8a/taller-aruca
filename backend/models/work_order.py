from .user import db
from datetime import datetime


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
    fecha_ingreso = db.Column(db.DateTime, default=datetime.utcnow)
    usuario_recepcion = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    photo = db.relationship('Photo', backref='work_order', uselist=False, lazy=True)
    status_history = db.relationship('StatusHistory', backref='work_order', lazy=True)

    receiver = db.relationship('User', backref='received_orders')

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
            'fecha_ingreso': self.fecha_ingreso.isoformat() if self.fecha_ingreso else None,
            'usuario_recepcion': self.usuario_recepcion,
            'cliente': self.client.to_dict() if self.client else None,
            'equipo': self.equipment.to_dict() if self.equipment else None,
            'recepcionista': self.receiver.to_dict() if self.receiver else None
        }
