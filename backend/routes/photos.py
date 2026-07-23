from flask import Blueprint, request, jsonify, redirect
from models.photo import Photo, db
from models.work_order import WorkOrder
from .auth import role_required
from supabase_storage import upload_to_storage, delete_from_storage, get_public_url, download_file
import os
import uuid

photos_bp = Blueprint('photos', __name__)

BUCKET = 'fotos'
LOCAL_FOLDER = os.path.join('/tmp', 'uploads') if os.getenv('VERCEL') else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(LOCAL_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

CONTENT_TYPES = {
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
}

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
        try:
            delete_from_storage(BUCKET, existing.ruta_foto)
        except:
            pass
        db.session.delete(existing)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{order_id}/{uuid.uuid4().hex}.{ext}"
    file_bytes = file.read()
    content_type = CONTENT_TYPES.get(ext, 'image/jpeg')

    try:
        upload_to_storage(BUCKET, filename, file_bytes, content_type)
    except Exception as e:
        return jsonify({'error': f'Error al subir foto: {str(e)}'}), 500

    photo = Photo(orden_trabajo_id=order_id, ruta_foto=filename)
    db.session.add(photo)
    db.session.commit()
    return jsonify(photo.to_dict()), 201

@photos_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_photo(order_id):
    photo = Photo.query.filter_by(orden_trabajo_id=order_id).first()
    if not photo:
        return jsonify({'error': 'No hay foto asociada'}), 404
    data = photo.to_dict()
    data['url'] = get_public_url(BUCKET, photo.ruta_foto)
    return jsonify(data)

@photos_bp.route('/uploads/<path:filename>')
def serve_photo(filename):
    try:
        file_bytes = download_file(BUCKET, filename)
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpeg'
        content_type = CONTENT_TYPES.get(ext, 'image/jpeg')
        from flask import Response
        return Response(file_bytes, content_type=content_type)
    except:
        url = get_public_url(BUCKET, filename)
        return redirect(url)
