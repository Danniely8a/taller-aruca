from .auth import auth_bp
from .users import users_bp
from .clients import clients_bp
from .equipments import equipments_bp
from .work_orders import work_orders_bp
from .photos import photos_bp
from .status_history import status_history_bp
from .qr import qr_bp

__all__ = [
    'auth_bp', 'users_bp', 'clients_bp', 'equipments_bp',
    'work_orders_bp', 'photos_bp', 'status_history_bp', 'qr_bp'
]
