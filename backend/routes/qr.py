import os
from flask import Blueprint, send_file, jsonify
from models.work_order import WorkOrder
from .auth import role_required
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from PIL import Image, ImageDraw, ImageFont
import io

qr_bp = Blueprint('qr', __name__)

QR_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'qr')
os.makedirs(QR_FOLDER, exist_ok=True)

@qr_bp.route('/<int:order_id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas')
def generate_qr(order_id):
    order = WorkOrder.query.get_or_404(order_id)

    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(f"OT:{order.numero_ot}|COD:{order.codigo_corto}|ID:{order.id}")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")

    label_width = 300
    label_height = 350
    label = Image.new('RGB', (label_width, label_height), 'white')

    qr_resized = qr_img.resize((200, 200))
    label.paste(qr_resized, (50, 10))

    draw = ImageDraw.Draw(label)

    try:
        font_large = ImageFont.truetype("arial.ttf", 22)
        font_small = ImageFont.truetype("arial.ttf", 14)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    draw.text((label_width//2, 220), f"OT: {order.numero_ot}", fill='black', anchor='mm', font=font_large)
    draw.text((label_width//2, 250), f"Código: {order.codigo_corto}", fill='black', anchor='mm', font=font_small)

    client = order.client
    if client:
        draw.text((label_width//2, 280), f"Cliente: {client.nombre}", fill='black', anchor='mm', font=font_small)

    equip = order.equipment
    if equip:
        draw.text((label_width//2, 300), f"{equip.tipo_equipo} - {equip.marca}", fill='black', anchor='mm', font=font_small)
        draw.text((label_width//2, 320), f"Modelo: {equip.modelo}", fill='black', anchor='mm', font=font_small)

    buffer = io.BytesIO()
    label.save(buffer, format='PNG')
    buffer.seek(0)

    filepath = os.path.join(QR_FOLDER, f'etiqueta_{order.codigo_corto}.png')
    label.save(filepath)

    return send_file(buffer, mimetype='image/png', as_attachment=True,
                     download_name=f'etiqueta_{order.codigo_corto}.png')
