from .user import db
from utils import now_ve


class StatusHistory(db.Model):
    __tablename__ = 'status_history'

    id = db.Column(db.Integer, primary_key=True)
    orden_trabajo_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    estado_anterior = db.Column(db.String(50), nullable=True)
    nuevo_estado = db.Column(db.String(50), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    fecha_cambio = db.Column(db.DateTime, default=now_ve)

    user = db.relationship('User', backref='status_changes')

    def to_dict(self):
        return {
            'id': self.id,
            'orden_trabajo_id': self.orden_trabajo_id,
            'estado_anterior': self.estado_anterior,
            'nuevo_estado': self.nuevo_estado,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.user.nombre if self.user else None,
            'fecha_cambio': self.fecha_cambio.isoformat() if self.fecha_cambio else None
        }
