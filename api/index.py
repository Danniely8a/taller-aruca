import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)
os.chdir(backend_path)

from app import app as application

try:
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
except Exception as e:
    import traceback
    print(f"DB Init Error: {e}")
    traceback.print_exc()

app = application
