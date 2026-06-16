from .user import db
from datetime import datetime


class Photo(db.Model):
    __tablename__ = 'photos'

    id = db.Column(db.Integer, primary_key=True)
    orden_trabajo_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), unique=True, nullable=False)
    ruta_foto = db.Column(db.String(500), nullable=False)
    fecha_recibido = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'orden_trabajo_id': self.orden_trabajo_id,
            'ruta_foto': self.ruta_foto,
            'fecha_recibido': self.fecha_recibido.isoformat() if self.fecha_recibido else None
        }
