import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app as application
from models.user import db

with application.app_context():
    db.create_all()

    from models.user import User
    if User.query.count() == 0:
        usuarios = [
            {'nombre': 'Alberto Bonetti', 'correo': 'alberto@aruca.com', 'rol': 'Gerente General'},
            {'nombre': 'Eduardo Reinosa', 'correo': 'eduardo@aruca.com', 'rol': 'Técnico'},
            {'nombre': 'Hernán Rojas', 'correo': 'hernan@aruca.com', 'rol': 'Supervisor'},
            {'nombre': 'Daniely Ochoa', 'correo': 'daniely@aruca.com', 'rol': 'Recepción / Ventas'},
            {'nombre': 'Carlos Perez', 'correo': 'carlos@gmail.com', 'rol': 'Técnico'},
            {'nombre': 'Genesis', 'correo': 'genesis@aruca.com', 'rol': 'Pagos'},
        ]
        for u in usuarios:
            user = User(nombre=u['nombre'], correo=u['correo'], rol=u['rol'])
            user.set_password('123456')
            db.session.add(user)
        db.session.commit()

app = application
