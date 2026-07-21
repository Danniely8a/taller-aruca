from .user import db
from utils import now_ve

class PagoSemanal(db.Model):
    __tablename__ = 'pagos_semanales'

    id = db.Column(db.Integer, primary_key=True)
    tecnico_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    semana_inicio = db.Column(db.Date, nullable=False)
    semana_fin = db.Column(db.Date, nullable=False)
    total_ordenes = db.Column(db.Integer, default=0)
    total_items = db.Column(db.Text, nullable=True)
    total_cantidad = db.Column(db.Integer, default=0)
    validado = db.Column(db.Boolean, default=False)
    validado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    fecha_validacion = db.Column(db.DateTime, nullable=True)
    observaciones = db.Column(db.Text, nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=now_ve)

    tecnico = db.relationship('User', foreign_keys=[tecnico_id], backref='pagos_semanales')
    admin = db.relationship('User', foreign_keys=[validado_por], backref='pagos_validados')

    def to_dict(self):
        return {
            'id': self.id,
            'tecnico_id': self.tecnico_id,
            'tecnico_nombre': self.tecnico.nombre if self.tecnico else None,
            'semana_inicio': self.semana_inicio.isoformat() if self.semana_inicio else None,
            'semana_fin': self.semana_fin.isoformat() if self.semana_fin else None,
            'total_ordenes': self.total_ordenes,
            'total_items': self.total_items,
            'total_cantidad': self.total_cantidad,
            'validado': self.validado,
            'validado_por': self.validado_por,
            'validado_nombre': self.admin.nombre if self.admin else None,
            'fecha_validacion': self.fecha_validacion.isoformat() if self.fecha_validacion else None,
            'observaciones': self.observaciones,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }
