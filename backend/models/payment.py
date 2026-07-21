from .user import db
from utils import now_ve


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    orden_trabajo_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    descripcion = db.Column(db.String(200), nullable=True)
    comprobante_ruta = db.Column(db.String(500), nullable=True)
    fecha_pago = db.Column(db.DateTime, default=now_ve)
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    work_order = db.relationship('WorkOrder', backref='payments')
    user = db.relationship('User', backref='payments')

    def to_dict(self):
        return {
            'id': self.id,
            'orden_trabajo_id': self.orden_trabajo_id,
            'monto': self.monto,
            'descripcion': self.descripcion,
            'comprobante_ruta': self.comprobante_ruta,
            'fecha_pago': self.fecha_pago.isoformat() if self.fecha_pago else None,
            'usuario_nombre': self.user.nombre if self.user else None
        }
