from .user import db


class Equipment(db.Model):
    __tablename__ = 'equipments'

    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    tipo_equipo = db.Column(db.String(50), nullable=False)
    marca = db.Column(db.String(50), nullable=False)
    modelo = db.Column(db.String(50), nullable=False)
    numero_serie = db.Column(db.String(100), nullable=True)

    work_orders = db.relationship('WorkOrder', backref='equipment', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'tipo_equipo': self.tipo_equipo,
            'marca': self.marca,
            'modelo': self.modelo,
            'numero_serie': self.numero_serie
        }
