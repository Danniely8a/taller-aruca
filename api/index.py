import sys
import os
import traceback

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)
os.chdir(backend_path)

try:
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

    @application.route('/api/debug-routes', methods=['GET'])
    def debug_routes():
        from flask import jsonify
        routes = []
        for rule in application.url_map.iter_rules():
            routes.append(f"{rule.methods} {rule.rule}")
        return jsonify(sorted(routes))

    app = application
except Exception as e:
    traceback.print_exc()
    from flask import Flask, jsonify
    app = Flask(__name__)

    @app.route('/api/debug-error', methods=['GET'])
    def debug_error():
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()})
