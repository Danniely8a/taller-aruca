from flask import Blueprint, request, jsonify, redirect, Response
from models.photo import Photo, db
from models.work_order import WorkOrder
from .auth import role_required
import os
import io
import base64
import uuid

photos_bp = Blueprint('photos', __name__)

BUCKET = 'fotos'
LOCAL_FOLDER = os.path.join('/tmp', 'uploads') if os.getenv('VERCEL') else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(LOCAL_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

CONTENT_TYPES = {
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'gif': 'image/gif', 'webp': 'image/webp', 'heic': 'image/heic', 'heif': 'image/heif',
}

def _register_heif():
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except Exception:
        pass

def _normalize_image(file_bytes, ext):
    if ext not in ('heic', 'heif'):
        return file_bytes, ext, CONTENT_TYPES.get(ext, 'image/jpeg')
    _register_heif()
    from PIL import Image, ImageOps
    im = Image.open(io.BytesIO(file_bytes))
    try:
        im = ImageOps.exif_transpose(im)
    except Exception:
        pass
    max_dim = 1600
    if im.width > max_dim or im.height > max_dim:
        im.thumbnail((max_dim, max_dim))
    if im.mode != 'RGB':
        im = im.convert('RGB')
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=85)
    return buf.getvalue(), 'jpg', 'image/jpeg'

def _try_storage():
    try:
        from supabase_storage import upload_to_storage, delete_from_storage, get_public_url, download_file
        return upload_to_storage, delete_from_storage, get_public_url, download_file
    except:
        return None, None, None, None

def _fallback_save(file_bytes, filename):
    filepath = os.path.join(LOCAL_FOLDER, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(file_bytes)

def _fallback_url(filename):
    return f'/api/photos/uploads/{filename}'

def _fallback_read(filename):
    filepath = os.path.join(LOCAL_FOLDER, filename)
    with open(filepath, 'rb') as f:
        return f.read()

def _as_data_url(file_bytes, content_type):
    return f'data:{content_type};base64,{base64.b64encode(file_bytes).decode()}'

@photos_bp.route('/<int:order_id>', methods=['POST'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def upload_photo(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    if 'foto' not in request.files:
        return jsonify({'error': 'No se envió ninguna foto'}), 400

    file = request.files['foto']
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó archivo'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Tipo de archivo no permitido. Use: JPG, PNG, WEBP, GIF o HEIC'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    file_bytes = file.read()

    try:
        file_bytes, ext, content_type = _normalize_image(file_bytes, ext)
    except Exception:
        return jsonify({'error': 'No se pudo procesar la imagen. Si es HEIC, conviértela a JPG en el teléfono o toma la foto en JPG.'}), 400

    existing = Photo.query.filter_by(orden_trabajo_id=order_id).first()
    if existing:
        ruta = existing.ruta_foto or ''
        if ruta.startswith('http'):
            upload_to_storage, delete_from_storage, _, _ = _try_storage()
            if delete_from_storage:
                try:
                    delete_from_storage(BUCKET, ruta)
                except:
                    pass
        elif not ruta.startswith('data:') and '/' in ruta:
            old_path = os.path.join(LOCAL_FOLDER, ruta)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except:
                    pass
        db.session.delete(existing)
        db.session.flush()

    filename = f"{order_id}/{uuid.uuid4().hex}.{ext}"

    stored = False
    upload_to_storage, _, _, _ = _try_storage()
    if upload_to_storage:
        try:
            upload_to_storage(BUCKET, filename, file_bytes, content_type)
            stored = True
        except Exception:
            stored = False

    if stored:
        ruta_foto = filename
    else:
        data_url = _as_data_url(file_bytes, content_type)
        if len(data_url) > 4000000:
            return jsonify({'error': 'La foto es demasiado pesada. Intenta con una imagen más pequeña.'}), 400
        ruta_foto = data_url
        try:
            _fallback_save(file_bytes, filename)
        except Exception:
            pass

    photo = Photo(orden_trabajo_id=order_id, ruta_foto=ruta_foto)
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
    ruta = photo.ruta_foto or ''
    if ruta.startswith('data:') or ruta.startswith('http'):
        data['url'] = ruta
    else:
        _, _, get_public_url, _ = _try_storage()
        if get_public_url:
            data['url'] = get_public_url(BUCKET, ruta)
        else:
            data['url'] = _fallback_url(ruta)
    return jsonify(data)

@photos_bp.route('/uploads/<path:filename>')
def serve_photo(filename):
    if filename.startswith('data:'):
        return jsonify({'error': 'Ruta inválida'}), 400
    _, _, _, download_file = _try_storage()
    if download_file:
        try:
            file_bytes = download_file(BUCKET, filename)
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpeg'
            content_type = CONTENT_TYPES.get(ext, 'image/jpeg')
            return Response(file_bytes, content_type=content_type)
        except:
            pass
    try:
        file_bytes = _fallback_read(filename)
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpeg'
        content_type = CONTENT_TYPES.get(ext, 'image/jpeg')
        return Response(file_bytes, content_type=content_type)
    except:
        return jsonify({'error': 'Foto no encontrada'}), 404
