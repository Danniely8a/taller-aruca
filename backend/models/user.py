from flask_sqlalchemy import SQLAlchemy
import bcrypt as _bcrypt
from flask_login import UserMixin
from utils import now_ve
import random
import string

db = SQLAlchemy()


class BcryptCompat:
    def generate_password_hash(self, password):
        return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')
    def check_password_hash(self, hashed, password):
        return _bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    def init_app(self, app):
        pass

bcrypt = BcryptCompat()


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    contrasena = db.Column(db.String(200), nullable=False)
    telefono = db.Column(db.String(20), nullable=True)
    rol = db.Column(db.String(50), nullable=False)
    permisos = db.Column(db.Text, nullable=True)
    activo = db.Column(db.Boolean, default=True)
    fecha_registro = db.Column(db.DateTime, default=now_ve)

    def set_password(self, password):
        result = bcrypt.generate_password_hash(password)
        self.contrasena = result if isinstance(result, str) else result.decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.contrasena, password)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'correo': self.correo,
            'telefono': self.telefono,
            'rol': self.rol,
            'permisos': self.permisos,
            'activo': self.activo,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }


class PasswordResetCode(db.Model):
    __tablename__ = 'password_reset_codes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.DateTime, default=now_ve)

    @staticmethod
    def generate_code():
        return ''.join(random.choices(string.digits, k=6))
