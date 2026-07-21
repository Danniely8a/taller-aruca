from .user import db
from utils import now_ve


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.Integer, primary_key=True)
    cedula_rif = db.Column(db.String(20), nullable=True)
    nombre = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20), nullable=False)
    empresa = db.Column(db.String(100), nullable=True)
    correo = db.Column(db.String(120), nullable=True)
    fecha_registro = db.Column(db.DateTime, default=now_ve)

    equipments = db.relationship('Equipment', backref='client', lazy=True)
    work_orders = db.relationship('WorkOrder', backref='client', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'cedula_rif': self.cedula_rif,
            'nombre': self.nombre,
            'telefono': self.telefono,
            'empresa': self.empresa,
            'correo': self.correo,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }
