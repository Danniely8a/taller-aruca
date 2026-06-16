from .user import db
from datetime import datetime


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20), nullable=False)
    empresa = db.Column(db.String(100), nullable=True)
    correo = db.Column(db.String(120), nullable=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    equipments = db.relationship('Equipment', backref='client', lazy=True)
    work_orders = db.relationship('WorkOrder', backref='client', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'telefono': self.telefono,
            'empresa': self.empresa,
            'correo': self.correo,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }
