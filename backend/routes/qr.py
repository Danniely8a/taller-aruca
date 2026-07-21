import os
import socket
import re
from flask import Blueprint, send_file, jsonify, request
from models.work_order import WorkOrder
from .auth import role_required
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from PIL import Image, ImageDraw, ImageFont
import io

qr_bp = Blueprint('qr', __name__)

QR_FOLDER = os.path.join('/tmp', 'uploads', 'qr') if os.getenv('VERCEL') else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'qr')
os.makedirs(QR_FOLDER, exist_ok=True)

def get_site_url():
    site_url = os.getenv('SITE_URL')
    if site_url:
        return site_url.rstrip('/')
    error_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cloudflared_error.txt')
    if os.path.exists(error_file):
        try:
            with open(error_file, 'r') as f:
                content = f.read()
            match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', content)
            if match:
                return match.group(0)
        except Exception:
            pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return f"http://{ip}:8080"
    except Exception:
        return request.host_url.rstrip('/')

@qr_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def generate_qr(order_id):
    order = WorkOrder.query.get_or_404(order_id)

    client = order.client
    equip = order.equipment

    site_url = get_site_url()
    qr_text = f"{site_url}/ver/ot/{order.id}"

    qr = qrcode.QRCode(version=None, box_size=10, border=2)
    qr.add_data(qr_text)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")

    label_width = 300
    label_height = 350
    label = Image.new('RGB', (label_width, label_height), 'white')

    qr_resized = qr_img.resize((200, 200))
    label.paste(qr_resized, (50, 10))

    draw = ImageDraw.Draw(label)

    try:
        font_large = ImageFont.truetype("arial.ttf", 20)
        font_small = ImageFont.truetype("arial.ttf", 13)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    y = 220
    draw.text((label_width//2, y), f"OT: {order.numero_ot}", fill='black', anchor='mm', font=font_large)
    y += 25
    draw.text((label_width//2, y), f"Código: {order.codigo_corto}", fill='black', anchor='mm', font=font_small)
    y += 22

    if client:
        draw.text((label_width//2, y), f"Cliente: {client.nombre}", fill='black', anchor='mm', font=font_small)
        y += 20

    if equip:
        draw.text((label_width//2, y), f"{equip.tipo_equipo} - {equip.marca} {equip.modelo}", fill='black', anchor='mm', font=font_small)

    buffer = io.BytesIO()
    label.save(buffer, format='PNG')
    buffer.seek(0)

    filepath = os.path.join(QR_FOLDER, f'etiqueta_{order.codigo_corto}.png')
    label.save(filepath)

    return send_file(buffer, mimetype='image/png', as_attachment=True,
                     download_name=f'etiqueta_{order.codigo_corto}.png')
