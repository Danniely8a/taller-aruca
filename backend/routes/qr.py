import os
import socket
import re
import json
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

def _load_items(order):
    if not order.item_seleccionado or order.item_seleccionado == '[]':
        return []
    try:
        items = json.loads(order.item_seleccionado)
    except Exception:
        return []
    result = []
    for it in items:
        if isinstance(it, dict):
            nombre = (it.get('item') or '').strip()
            cantidad = it.get('cantidad', 1)
        else:
            nombre = str(it).strip()
            cantidad = 1
        if nombre:
            result.append((nombre, cantidad))
    return result

def _wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current = ''
    for w in words:
        test = f'{current} {w}'.strip()
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines or [text]

def _load_logo():
    paths = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'isotipo_aruca.png'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logo_aruca.png'),
    ]
    for path in paths:
        if os.path.exists(path):
            try:
                return Image.open(path).convert('RGBA')
            except Exception:
                continue
    return None

@qr_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def generate_qr(order_id):
    order = WorkOrder.query.get_or_404(order_id)

    client = order.client
    equip = order.equipment
    items = _load_items(order)

    site_url = get_site_url()
    qr_text = f"{site_url}/ver/ot/{order.id}"

    qr = qrcode.QRCode(version=None, box_size=10, border=2)
    qr.add_data(qr_text)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")

    label_width = 300
    logo_h = 56
    logo_top = 6
    qr_top = logo_top + logo_h + 6
    qr_size = 150
    qr_left = (label_width - qr_size) // 2
    base_height = qr_top + qr_size + 175
    item_lines = []

    try:
        font_large = ImageFont.truetype("arialbd.ttf", 22)
        font_small = ImageFont.truetype("arial.ttf", 15)
        font_item = ImageFont.truetype("arial.ttf", 13)
        font_bold = ImageFont.truetype("arialbd.ttf", 15)
        font_client_label = ImageFont.truetype("arial.ttf", 12)
        font_client = ImageFont.truetype("arialbd.ttf", 18)
    except Exception:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_item = ImageFont.load_default()
        font_bold = ImageFont.load_default()
        font_client_label = ImageFont.load_default()
        font_client = ImageFont.load_default()

    tmp_label = Image.new('RGB', (label_width, base_height), 'white')
    tmp_draw = ImageDraw.Draw(tmp_label)
    margin = 20
    text_width = label_width - margin * 2

    for nombre, cantidad in items:
        cant = cantidad if isinstance(cantidad, int) and cantidad > 0 else 1
        for line in _wrap_text(f"{cant}x {nombre}", font_item, text_width, tmp_draw):
            item_lines.append(line)

    extra = 0
    if item_lines:
        extra = 30 + len(item_lines) * 16 + 6

    label_height = base_height + extra
    label = Image.new('RGB', (label_width, label_height), 'white')

    logo = _load_logo()
    if logo:
        ratio = logo_h / logo.height
        logo_w = max(1, int(logo.width * ratio))
        logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
        label.paste(logo, ((label_width - logo_w) // 2, logo_top), logo)

    qr_resized = qr_img.resize((qr_size, qr_size))
    label.paste(qr_resized, (qr_left, qr_top))
    draw = ImageDraw.Draw(label)

    y = qr_top + qr_size + 14
    draw.text((label_width // 2, y), f"OT: {order.numero_ot}", fill='black', anchor='mm', font=font_large)
    y += 26
    draw.text((label_width // 2, y), f"Código: {order.codigo_corto}", fill='black', anchor='mm', font=font_small)
    y += 22

    if order.fecha_ingreso:
        fecha = order.fecha_ingreso.strftime('%d/%m/%Y')
        hora = order.fecha_ingreso.strftime('%I:%M %p').replace('AM', 'a.m.').replace('PM', 'p.m.')
        draw.text((label_width // 2, y), f"Ingreso: {fecha} {hora}", fill='black', anchor='mm', font=font_small)
        y += 22

    if client:
        draw.text((label_width // 2, y), "Cliente:", fill='#4B5563', anchor='mm', font=font_client_label)
        y += 16
        for line in _wrap_text(client.nombre or '', font_client, text_width, draw):
            draw.text((label_width // 2, y), line, fill='black', anchor='mm', font=font_client)
            y += 22
        y += 2

    if equip:
        eq_text = f"{equip.tipo_equipo} - {equip.marca} {equip.modelo}".strip(' -')
        for line in _wrap_text(eq_text, font_small, text_width, draw):
            draw.text((label_width // 2, y), line, fill='black', anchor='mm', font=font_small)
            y += 20
        y += 2

    if item_lines:
        draw.text((label_width // 2, y), "Ítems de Afilado", fill='black', anchor='mm', font=font_bold)
        y += 24
        for line in item_lines:
            draw.text((label_width // 2, y), line, fill='black', anchor='mm', font=font_item)
            y += 16

    buffer = io.BytesIO()
    label.save(buffer, format='PNG')
    buffer.seek(0)

    filepath = os.path.join(QR_FOLDER, f'etiqueta_{order.codigo_corto}.png')
    label.save(filepath)

    return send_file(buffer, mimetype='image/png', as_attachment=True,
                     download_name=f'etiqueta_{order.codigo_corto}.png')
