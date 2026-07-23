from flask import Blueprint, request, jsonify, send_from_directory
from models.photo import Photo, db
from models.work_order import WorkOrder
from .auth import role_required
from werkzeug.utils import secure_filename
import os
import uuid

photos_bp = Blueprint('photos', __name__)

UPLOAD_FOLDER = os.path.join('/tmp', 'uploads') if os.getenv('VERCEL') else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@photos_bp.route('/<int:order_id>', methods=['POST'])
@role_required('Gerente General', 'Recepción / Ventas')
def upload_photo(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    if 'foto' not in request.files:
        return jsonify({'error': 'No se envió ninguna foto'}), 400

    file = request.files['foto']
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó archivo'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Tipo de archivo no permitido. Use: PNG, JPG, GIF, WEBP'}), 400

    existing = Photo.query.filter_by(orden_trabajo_id=order_id).first()
    if existing:
        old_path = os.path.join(UPLOAD_FOLDER, existing.ruta_foto)
        if os.path.exists(old_path):
            os.remove(old_path)
        db.session.delete(existing)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({'error': f'Error al guardar archivo: {str(e)}'}), 500

    photo = Photo(
        orden_trabajo_id=order_id,
        ruta_foto=filename
    )
    db.session.add(photo)
    db.session.commit()
    return jsonify(photo.to_dict()), 201

@photos_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_photo(order_id):
    photo = Photo.query.filter_by(orden_trabajo_id=order_id).first()
    if not photo:
        return jsonify({'error': 'No hay foto asociada'}), 404
    return jsonify(photo.to_dict())

@photos_bp.route('/uploads/<filename>')
def serve_photo(filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Foto no disponible en este servidor'}), 404
    return send_from_directory(UPLOAD_FOLDER, filename)
