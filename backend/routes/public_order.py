import os
import json
from flask import Blueprint, render_template_string, jsonify
from models.work_order import WorkOrder
from models.client import Client
from models.equipment import Equipment
from models.status_history import StatusHistory

public_order_bp = Blueprint('public_order', __name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden {{ order.numero_ot }} - Taller Aruca</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; color: #333; }
        .header { background: linear-gradient(135deg, #1a237e, #0d47a1); color: white; padding: 20px; text-align: center; }
        .header h1 { font-size: 1.3em; margin-bottom: 5px; }
        .header .ot-number { font-size: 2em; font-weight: bold; }
        .header .codigo { font-size: 0.9em; opacity: 0.8; }
        .container { max-width: 600px; margin: 0 auto; padding: 15px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 0.9em; margin: 10px 0; }
        .st-Pendiente { background: #fff3e0; color: #e65100; }
        .st-Recibido { background: #fff3e0; color: #e65100; }
        .st-En%20Proceso, .st-En\\ Proceso { background: #e3f2fd; color: #1565c0; }
        .st-En%20Diagn%C3%B3stico%20%2F%20Presupuesto, .st-En\\ Diagn%C3%B3stico\\ /\\ Presupuesto { background: #f3e5f5; color: #7b1fa2; }
        .st-Diagn%C3%B3stico, .st-Diagn%C3%B3stico { background: #f3e5f5; color: #7b1fa2; }
        .st-Presupuesto { background: #fce4ec; color: #c62828; }
        .st-Reparaci%C3%B3n, .st-Reparaci%C3%B3n { background: #e8f5e9; color: #2e7d32; }
        .st-Afilando { background: #e0f7fa; color: #00695c; }
        .st-Listo%20para%20Entrega, .st-Listo\\ para\\ Entrega { background: #e0f7fa; color: #00695c; }
        .st-Entregado { background: #e8eaf6; color: #283593; }
        .st-Entregado%20%28Pagado%29, .st-Entregado\\ \\(Pagado\\) { background: #e8eaf6; color: #283593; }
        .st-Pagado { background: #e8eaf6; color: #283593; }
        .st-Devoluci%C3%B3n%20por%20Garant%C3%ADa, .st-Devoluci%C3%B3n\\ por\\ Garant%C3%ADa { background: #fbe9e7; color: #bf360c; }
        .st-Recibido%20para%20Reparaci%C3%B3n, .st-Recibido\\ para\\ Reparaci%C3%B3n { background: #fff3e0; color: #e65100; }
        .card { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { font-size: 0.85em; text-transform: uppercase; color: #666; margin-bottom: 10px; letter-spacing: 0.5px; }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #888; font-size: 0.9em; }
        .info-value { font-weight: 500; font-size: 0.9em; }
        .falla { background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px; border-radius: 0 8px 8px 0; margin-top: 10px; }
        .falla-text { font-size: 0.95em; line-height: 1.4; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 0.8em; }
        .timeline { list-style: none; padding: 0; }
        .timeline li { position: relative; padding: 8px 0 8px 20px; border-left: 2px solid #e0e0e0; font-size: 0.85em; }
        .timeline li:last-child { border-left-color: #1a237e; }
        .timeline li::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: #bdbdbd; position: absolute; left: -6px; top: 12px; }
        .timeline li:last-child::before { background: #1a237e; }
        .timeline .date { color: #999; font-size: 0.8em; }
        .priority-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .priority-badge.Alta { background: #ffebee; color: #c62828; }
        .priority-badge.Media { background: #fff3e0; color: #ef6c00; }
        .priority-badge.Baja { background: #e8f5e9; color: #2e7d32; }
        .refresh-indicator { text-align: center; padding: 6px; color: #999; font-size: 0.75em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Taller Aruca</h1>
        <div class="ot-number">OT {{ order.numero_ot }}</div>
        <div class="codigo">{{ order.codigo_corto }}</div>
    </div>
    <div class="container">
        <div class="card" id="estado-card">
            <h3>Estado Actual</h3>
            <span class="status-badge st-{{ order.estado }}" id="estado-badge">{{ order.estado }}</span>
            <span class="priority-badge {{ order.prioridad }}">{{ order.prioridad }}</span>
            <div class="info-row" style="margin-top:10px"><span class="info-label">Tipo de Servicio</span><span class="info-value" id="tipo-servicio">{{ order.tipo_servicio or 'Reparación' }}</span></div>
            {% if items|length > 0 %}
            <div class="info-row"><span class="info-label">Ítems de Afilado</span><span class="info-value">{{ items|join(', ') }}</span></div>
            {% endif %}
        </div>

        <div class="card">
            <h3>Cliente</h3>
            {% if client %}
            <div class="info-row"><span class="info-label">Nombre</span><span class="info-value">{{ client.nombre }}</span></div>
            {% if client.cedula_rif %}<div class="info-row"><span class="info-label">RIF/Cédula</span><span class="info-value">{{ client.cedula_rif }}</span></div>{% endif %}
            {% if client.telefono %}<div class="info-row"><span class="info-label">Teléfono</span><span class="info-value">{{ client.telefono }}</span></div>{% endif %}
            {% if client.correo %}<div class="info-row"><span class="info-label">Email</span><span class="info-value">{{ client.correo }}</span></div>{% endif %}
            {% if client.empresa %}<div class="info-row"><span class="info-label">Empresa</span><span class="info-value">{{ client.empresa }}</span></div>{% endif %}
            {% else %}
            <p style="color:#999">Sin cliente asignado</p>
            {% endif %}
        </div>

        <div class="card">
            <h3>Equipo</h3>
            {% if equip %}
            <div class="info-row"><span class="info-label">Tipo</span><span class="info-value">{{ equip.tipo_equipo }}</span></div>
            <div class="info-row"><span class="info-label">Marca</span><span class="info-value">{{ equip.marca }}</span></div>
            <div class="info-row"><span class="info-label">Modelo</span><span class="info-value">{{ equip.modelo }}</span></div>
            {% if equip.numero_serie %}<div class="info-row"><span class="info-label">N° Serie</span><span class="info-value">{{ equip.numero_serie }}</span></div>{% endif %}
            {% else %}
            <p style="color:#999">Sin equipo asignado</p>
            {% endif %}
        </div>

        {% if order.falla_reportada %}
        <div class="card">
            <h3>Requerimiento del Cliente</h3>
            <div class="falla">
                <div class="falla-text">{{ order.falla_reportada }}</div>
            </div>
        </div>
        {% endif %}

        <div class="card">
            <h3>Fechas</h3>
            <div class="info-row"><span class="info-label">Ingreso</span><span class="info-value">{{ order.fecha_ingreso.strftime('%d/%m/%Y %H:%M') if order.fecha_ingreso else '-' }}</span></div>
            <div class="info-row" style="background:#e8f5e9;padding:8px;border-radius:6px;margin-top:8px"><span class="info-label" style="color:#2e7d32;font-weight:bold">Tiempo Estimado de Entrega</span><span class="info-value" style="color:#2e7d32;font-weight:bold">4 días hábiles</span></div>
        </div>

        {% if historial %}
        <div class="card" id="historial-card">
            <h3>Historial de Estados</h3>
            <ul class="timeline" id="timeline">
                {% for h in historial %}
                <li>
                    <strong>{{ h.nuevo_estado }}</strong><br>
                    <span class="date">{{ h.fecha_cambio.strftime('%d/%m/%Y %H:%M') }}</span>
                    {% if h.user %}<br><span style="color:#666;font-size:0.8em">{{ h.user.nombre }}</span>{% endif %}
                </li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}

        <div class="refresh-indicator">Actualización automática cada 30s</div>
    </div>
    <div class="footer">Taller de Máquinas Aruca © 2026</div>

    <script>
        const ORDER_ID = {{ order.id }};
        let lastEstado = '{{ order.estado }}';

        async function actualizar() {
            try {
                const resp = await fetch('/ot/' + ORDER_ID + '/json');
                const data = await resp.json();
                const orden = data.orden;
                if (orden.estado !== lastEstado) {
                    lastEstado = orden.estado;
                    document.title = 'OT ' + orden.numero_ot + ' - ' + orden.estado + ' - Taller Aruca';
                    const badge = document.getElementById('estado-badge');
                    badge.textContent = orden.estado;
                    badge.className = 'status-badge st-' + orden.estado;
                }
            } catch(e) {}
        }

        setInterval(actualizar, 30000);
    </script>
</body>
</html>
"""


@public_order_bp.route('/ot/<int:order_id>', methods=['GET'])
def view_order(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    client = Client.query.get(order.cliente_id) if order.cliente_id else None
    equip = Equipment.query.get(order.equipo_id) if order.equipo_id else None
    historial = StatusHistory.query.filter_by(orden_trabajo_id=order.id).order_by(StatusHistory.fecha_cambio.asc()).all()

    items = []
    if order.item_seleccionado:
        try:
            items = json.loads(order.item_seleccionado)
        except:
            items = [order.item_seleccionado]

    from flask import render_template
    return render_template_string(HTML_TEMPLATE, order=order, client=client, equip=equip, historial=historial, items=items)


@public_order_bp.route('/ot/<int:order_id>/json', methods=['GET'])
def view_order_json(order_id):
    order = WorkOrder.query.get_or_404(order_id)
    client = Client.query.get(order.cliente_id) if order.cliente_id else None
    equip = Equipment.query.get(order.equipo_id) if order.equipo_id else None
    historial = StatusHistory.query.filter_by(orden_trabajo_id=order.id).order_by(StatusHistory.fecha_cambio.asc()).all()

    return jsonify({
        'orden': {
            'numero_ot': order.numero_ot,
            'codigo_corto': order.codigo_corto,
            'estado': order.estado,
            'prioridad': order.prioridad,
            'falla_reportada': order.falla_reportada,
            'notas_tecnicas': order.notas_tecnicas,
            'fecha_ingreso': order.fecha_ingreso.strftime('%d/%m/%Y %H:%M') if order.fecha_ingreso else None,
        },
        'cliente': {
            'nombre': client.nombre,
            'cedula_rif': client.cedula_rif,
            'telefono': client.telefono,
            'correo': client.correo,
            'empresa': client.empresa,
        } if client else None,
        'equipo': {
            'tipo_equipo': equip.tipo_equipo,
            'marca': equip.marca,
            'modelo': equip.modelo,
            'numero_serie': equip.numero_serie,
        } if equip else None,
        'historial': [{
            'estado_nuevo': h.nuevo_estado,
            'fecha': h.fecha_cambio.strftime('%d/%m/%Y %H:%M') if h.fecha_cambio else None,
            'usuario': h.user.nombre if h.user else None,
        } for h in historial]
    })
