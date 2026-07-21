import json
from flask import Blueprint, request, jsonify, render_template_string
from flask_login import current_user
from models.work_order import WorkOrder, db
from sqlalchemy import or_, and_
from models.status_history import StatusHistory
from models.client import Client
from models.equipment import Equipment
from models.user import User
from .auth import role_required
from datetime import datetime

work_orders_bp = Blueprint('work_orders', __name__)

ESTADOS = [
    'Recibido', 'En Diagnóstico', 'En Diagnóstico / Presupuesto', 'Esperando Presupuesto',
    'Esperando Aprobación', 'Esperando Repuestos', 'En Reparación',
    'Listo para Entrega', 'Entregado', 'Devolución por Garantía',
    'Afilando (En Proceso)', 'Pagado'
]

def generar_numero_ot():
    ultima = WorkOrder.query.order_by(WorkOrder.id.desc()).first()
    if ultima:
        num = int(ultima.numero_ot.replace('OT', '')) + 1
    else:
        num = 1
    return f'OT{num:04d}'

def generar_codigo_corto():
    ultima = WorkOrder.query.order_by(WorkOrder.id.desc()).first()
    if ultima:
        num = int(ultima.codigo_corto.replace('R', '')) + 1
    else:
        num = 1
    return f'R{num:03d}'

@work_orders_bp.route('/', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_work_orders():
    estado = request.args.get('estado')
    query = WorkOrder.query
    if current_user.rol == 'Técnico':
        if current_user.correo == 'carlos@gmail.com':
            query = query.filter_by(tecnico_asignado_id=current_user.id)
        else:
            query = query.filter(
                or_(
                    WorkOrder.tecnico_asignado_id == current_user.id,
                    and_(WorkOrder.tipo_servicio == 'Reparación', WorkOrder.tecnico_asignado_id == None)
                )
            )
    if estado:
        query = query.filter_by(estado=estado)
    orders = query.order_by(WorkOrder.fecha_ingreso.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@work_orders_bp.route('/<int:id>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def get_work_order(id):
    order = WorkOrder.query.get_or_404(id)
    return jsonify(order.to_dict())

@work_orders_bp.route('/', methods=['POST'])
@role_required('Gerente General', 'Recepción / Ventas')
def create_work_order():
    data = request.get_json()
    order = WorkOrder(
        numero_ot=generar_numero_ot(),
        codigo_corto=generar_codigo_corto(),
        cliente_id=data['cliente_id'],
        equipo_id=data['equipo_id'],
        estado='Recibido',
        prioridad=data.get('prioridad', 'Normal'),
        falla_reportada=data.get('falla_reportada', ''),
        usuario_recepcion=data['usuario_recepcion']
    )
    db.session.add(order)
    db.session.flush()

    history = StatusHistory(
        orden_trabajo_id=order.id,
        estado_anterior=None,
        nuevo_estado='Recibido',
        usuario_id=data['usuario_recepcion']
    )
    db.session.add(history)
    db.session.commit()
    return jsonify(order.to_dict()), 201

@work_orders_bp.route('/recepcion', methods=['POST'])
@role_required('Gerente General', 'Recepción / Ventas')
def recepcion_completa():
    data = request.get_json()

    client = Client.query.filter_by(telefono=data['telefono']).first()
    if not client:
        client = Client(
            cedula_rif=data.get('cedula_rif', ''),
            nombre=data['nombre_cliente'],
            telefono=data['telefono'],
            empresa=data.get('empresa', ''),
            correo=data.get('correo', '')
        )
        db.session.add(client)
        db.session.flush()
    else:
        client.cedula_rif = data.get('cedula_rif', client.cedula_rif) or client.cedula_rif
        client.nombre = data['nombre_cliente']
        client.empresa = data.get('empresa', client.empresa)
        client.correo = data.get('correo', client.correo)
        db.session.flush()

    tipo_servicio = data.get('tipo_servicio', 'Reparación')

    if tipo_servicio == 'Afilado':
        equip = Equipment(
            cliente_id=client.id,
            tipo_equipo='Servicio de Afilado',
            marca='-',
            modelo='-',
            numero_serie=''
        )
    else:
        equip = Equipment(
            cliente_id=client.id,
            tipo_equipo=data.get('tipo_equipo', ''),
            marca=data.get('marca', ''),
            modelo=data.get('modelo', ''),
            numero_serie=data.get('numero_serie', '')
        )
    db.session.add(equip)
    db.session.flush()

    tecnico_asignado_id = None
    if tipo_servicio == 'Afilado':
        carlos = User.query.filter_by(correo='carlos@gmail.com').first()
        if carlos:
            tecnico_asignado_id = carlos.id
    elif tipo_servicio == 'Reparación':
        eduardo = User.query.filter_by(correo='eduardo@aruca.com').first()
        if eduardo:
            tecnico_asignado_id = eduardo.id

    order = WorkOrder(
        numero_ot=generar_numero_ot(),
        codigo_corto=generar_codigo_corto(),
        cliente_id=client.id,
        equipo_id=equip.id,
        estado='Recibido',
        prioridad=data.get('prioridad', 'Normal'),
        falla_reportada=data.get('falla_reportada', ''),
        tipo_servicio=tipo_servicio,
        item_seleccionado=json.dumps(data.get('items_seleccionados', [])) if tipo_servicio == 'Afilado' else '[]',
        tecnico_asignado_id=tecnico_asignado_id,
        usuario_recepcion=data['usuario_recepcion']
    )
    db.session.add(order)
    db.session.flush()

    history = StatusHistory(
        orden_trabajo_id=order.id,
        estado_anterior=None,
        nuevo_estado='Recibido',
        usuario_id=data['usuario_recepcion']
    )
    db.session.add(history)
    db.session.commit()

    from routes.notifications import crear_notificacion
    tecnicos = User.query.filter_by(rol='Técnico', activo=True).all()
    for tecnico in tecnicos:
        crear_notificacion(
            tecnico.id,
            'Nueva orden de trabajo',
            f'Se creó la orden {order.numero_ot} ({order.codigo_corto}) - {equip.tipo_equipo} {equip.marca}',
            'orden_creada',
            order.id
        )

    if tecnico_asignado_id:
        crear_notificacion(
            tecnico_asignado_id,
            'Nueva orden de Afilado',
            f'Se te asignó la orden {order.numero_ot} ({order.codigo_corto}) - Afilado',
            'orden_creada',
            order.id
        )

    return jsonify(order.to_dict()), 201

@work_orders_bp.route('/ordenes-items', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Pagos')
def ordenes_items():
    orders = WorkOrder.query.order_by(WorkOrder.fecha_ingreso.desc()).all()
    return jsonify([{
        'id': o.id,
        'numero_ot': o.numero_ot,
        'codigo_corto': o.codigo_corto,
        'estado': o.estado,
        'tipo_servicio': o.tipo_servicio,
        'fecha_ingreso': o.fecha_ingreso.isoformat() if o.fecha_ingreso else None,
        'cliente_nombre': o.client.nombre if o.client else None,
        'item_seleccionado': json.loads(o.item_seleccionado) if o.item_seleccionado and o.item_seleccionado != '[]' else [],
        'items_listos': json.loads(o.items_listos) if o.items_listos and o.items_listos != '[]' else [],
        'items_validados': json.loads(o.items_validados) if o.items_validados and o.items_validados != '[]' else [],
    } for o in orders])

@work_orders_bp.route('/mis-ordenes', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Técnico', 'Recepción / Ventas')
def mis_ordenes():
    if current_user.correo == 'carlos@gmail.com':
        orders = WorkOrder.query.filter_by(tecnico_asignado_id=current_user.id).order_by(WorkOrder.fecha_ingreso.desc()).all()
    else:
        orders = WorkOrder.query.filter(
            or_(
                WorkOrder.tecnico_asignado_id == current_user.id,
                and_(WorkOrder.tipo_servicio == 'Reparación', WorkOrder.tecnico_asignado_id == None)
            )
        ).order_by(WorkOrder.fecha_ingreso.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@work_orders_bp.route('/<int:id>/estado', methods=['PUT'])
@role_required('Gerente General', 'Supervisor', 'Técnico', 'Recepción / Ventas')
def update_estado(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    nuevo_estado = data['nuevo_estado']

    ESTADOS_AFILADO = ['Recibido', 'Afilando (En Proceso)', 'Listo para Entrega', 'Pagado', 'Entregado']
    ESTADOS_REPARACION_TECNICO = ['Recibido', 'En Diagnóstico / Presupuesto', 'Listo para Entrega', 'Entregado']

    if order.tipo_servicio == 'Afilado' and current_user.rol == 'Técnico':
        if nuevo_estado not in ESTADOS_AFILADO:
            return jsonify({'error': 'Técnico solo puede usar estados de Afilado'}), 400
        if nuevo_estado == 'Pagado':
            return jsonify({'error': 'El técnico no puede marcar como Pagado'}), 400

    if order.tipo_servicio == 'Reparación' and current_user.rol == 'Técnico':
        if nuevo_estado not in ESTADOS_REPARACION_TECNICO:
            return jsonify({'error': 'Técnico solo puede usar estados de Reparación'}), 400

    if nuevo_estado not in ESTADOS:
        return jsonify({'error': 'Estado no válido'}), 400

    estado_anterior = order.estado
    order.estado = nuevo_estado

    history = StatusHistory(
        orden_trabajo_id=order.id,
        estado_anterior=estado_anterior,
        nuevo_estado=nuevo_estado,
        usuario_id=data['usuario_id']
    )
    db.session.add(history)
    db.session.commit()

    if nuevo_estado in ('Listo para Entrega', 'Entregado'):
        from routes.notifications import crear_notificacion
        usuarios_notificar = User.query.filter(
            User.rol.in_(['Recepción / Ventas', 'Supervisor', 'Gerente General']),
            User.activo == True
        ).all()
        for u in usuarios_notificar:
            crear_notificacion(
                u.id,
                f'Orden {nuevo_estado}',
                f'La orden {order.numero_ot} ({order.codigo_corto}) está "{nuevo_estado}"',
                'reparacion_finalizada',
                order.id
            )

    if nuevo_estado in ('En Diagnóstico', 'Esperando Presupuesto'):
        from routes.notifications import crear_notificacion
        usuarios_notificar = User.query.filter(
            User.rol.in_(['Recepción / Ventas', 'Supervisor']),
            User.activo == True
        ).all()
        for u in usuarios_notificar:
            crear_notificacion(
                u.id,
                f'Actualización: {nuevo_estado}',
                f'La orden {order.numero_ot} ({order.codigo_corto}) pasó a "{nuevo_estado}"',
                'actualizacion_orden',
                order.id
            )

    return jsonify(order.to_dict())

@work_orders_bp.route('/<int:id>/items-listos', methods=['PUT'])
@role_required('Gerente General', 'Supervisor', 'Técnico', 'Recepción / Ventas')
def update_items_listos(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    items_listos = data.get('items_listos', [])
    order.items_listos = json.dumps(items_listos)

    items_totales = json.loads(order.item_seleccionado) if order.item_seleccionado else []
    if items_totales and len(items_listos) == len(items_totales) and order.estado != 'Listo para Entrega':
        estado_anterior = order.estado
        order.estado = 'Listo para Entrega'
        history = StatusHistory(
            orden_trabajo_id=order.id,
            estado_anterior=estado_anterior,
            nuevo_estado='Listo para Entrega',
            usuario_id=data.get('usuario_id', current_user.id)
        )
        db.session.add(history)

        from routes.notifications import crear_notificacion
        usuarios_notificar = User.query.filter(
            User.rol.in_(['Recepción / Ventas', 'Supervisor', 'Gerente General']),
            User.activo == True
        ).all()
        for u in usuarios_notificar:
            crear_notificacion(
                u.id,
                'Orden Lista para Entrega',
                f'La orden {order.numero_ot} ({order.codigo_corto}) tiene todos los items listos',
                'reparacion_finalizada',
                order.id
            )

    db.session.commit()
    return jsonify(order.to_dict())

@work_orders_bp.route('/<int:id>/items-validados', methods=['PUT'])
@role_required('Gerente General', 'Supervisor', 'Pagos')
def update_items_validados(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    items_validados = data.get('items_validados', [])
    order.items_validados = json.dumps(items_validados)
    db.session.commit()
    return jsonify(order.to_dict())

@work_orders_bp.route('/<int:id>', methods=['PUT'])
@role_required('Gerente General', 'Recepción / Ventas')
def update_work_order(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    order.prioridad = data.get('prioridad', order.prioridad)
    order.falla_reportada = data.get('falla_reportada', order.falla_reportada)
    db.session.commit()
    return jsonify(order.to_dict())

@work_orders_bp.route('/<int:id>/notas', methods=['PUT'])
@role_required('Gerente General', 'Supervisor', 'Técnico')
def update_notas_tecnicas(id):
    order = WorkOrder.query.get_or_404(id)
    data = request.get_json()
    order.notas_tecnicas = data.get('notas_tecnicas', order.notas_tecnicas)
    db.session.commit()
    return jsonify(order.to_dict())

@work_orders_bp.route('/estados', methods=['GET'])
def get_estados():
    return jsonify(ESTADOS)


COMPROBANTE_HTML = """
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comprobante {{ order.numero_ot }} - Taller Aruca</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 13px; color: #333; background: #f5f5f5; }
  .page { width: 190mm; height: 110mm; margin: 84mm auto 0; background: white; padding: 12mm 14mm; overflow: hidden; border: 2px solid #B0D4E8; border-radius: 4px; display: flex; flex-direction: column; }
  @media print {
    body { background: white; margin: 0; padding: 0; }
    .page { margin: 84mm auto 0; padding: 10mm 12mm; width: 190mm; height: 110mm; box-shadow: none; border: 2px solid #B0D4E8; display: flex; flex-direction: column; }
    @page { size: 216mm 279mm; margin: 0; }
    .no-print { display: none !important; }
  }
  @media (min-width: 500px) {
    .page { box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; margin-top: 70px; }
  }
  .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 12px; }
  .header img { height: 35px; }
  .header h1 { font-size: 26px; color: #003A8C; letter-spacing: 3px; }
  .ot-number { text-align: center; font-size: 28px; font-weight: 900; color: #003A8C; margin: 6px 0 3px; }
  .codigo { text-align: center; font-size: 13px; color: #666; margin-bottom: 8px; }
  .columns { display: flex; gap: 14px; flex: 1; }
  .col-left { flex: 1; }
  .col-right { flex: 1; }
  .section { margin-bottom: 8px; }
  .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #003A8C; letter-spacing: 0.5px; margin-bottom: 3px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
  .row .label { color: #666; }
  .row .value { font-weight: bold; text-align: right; }
  .falla-box { background: #fff8e1; border-left: 3px solid #ffc107; padding: 6px 8px; border-radius: 0 4px 4px 0; font-size: 12px; line-height: 1.4; margin-bottom: 6px; }
  .footer { border-top: 1px dashed #ccc; padding-top: 5px; margin-top: auto; text-align: center; }
  .footer p { font-size: 11px; color: #999; }
  .nota { font-size: 10px; color: #666; margin-top: 5px; line-height: 1.4; }
  .btn-print { display: block; width: 100%; padding: 12px; background: #003A8C; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; margin-top: 16px; }
  .btn-print:hover { background: #0050CC; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="/logo_aruca.png" alt="ARUCA">
    <h1>ARUCA</h1>
  </div>

  <div class="ot-number">{{ order.numero_ot }}</div>
  <div class="codigo">Código: {{ order.codigo_corto }}</div>

  <div class="columns">
    <div class="col-left">
      <div class="section">
        <div class="section-title">Cliente</div>
        <div class="row"><span class="label">Nombre:</span><span class="value">{{ client.nombre }}</span></div>
        {% if client.cedula_rif %}<div class="row"><span class="label">RIF/Cédula:</span><span class="value">{{ client.cedula_rif }}</span></div>{% endif %}
        {% if client.telefono %}<div class="row"><span class="label">Teléfono:</span><span class="value">{{ client.telefono }}</span></div>{% endif %}
        {% if client.empresa %}<div class="row"><span class="label">Empresa:</span><span class="value">{{ client.empresa }}</span></div>{% endif %}
      </div>

      <div class="section">
        {% if order.tipo_servicio == 'Afilado' %}
        <div class="section-title">Servicio de Afilado</div>
        <div class="row"><span class="label">Tipo:</span><span class="value">Afilado</span></div>
        {% if items_text %}<div class="row"><span class="label">Ítems:</span><span class="value">{{ items_text }}</span></div>{% endif %}
        {% else %}
        <div class="section-title">Equipo</div>
        <div class="row"><span class="label">Tipo:</span><span class="value">{{ equip.tipo_equipo }}</span></div>
        <div class="row"><span class="label">Marca:</span><span class="value">{{ equip.marca }}</span></div>
        <div class="row"><span class="label">Modelo:</span><span class="value">{{ equip.modelo }}</span></div>
        {% if equip.numero_serie %}<div class="row"><span class="label">N° Serie:</span><span class="value">{{ equip.numero_serie }}</span></div>{% endif %}
        {% endif %}
      </div>
    </div>

    <div class="col-right">
      <div class="section">
        <div class="section-title">Detalles</div>
        <div class="row"><span class="label">Estado:</span><span class="value">{{ order.estado }}</span></div>
        <div class="row"><span class="label">Prioridad:</span><span class="value">{{ order.prioridad }}</span></div>
        <div class="row"><span class="label">Fecha Ingreso:</span><span class="value">{{ order.fecha_ingreso.strftime('%d/%m/%Y %H:%M') }}</span></div>
      </div>

      {% if order.falla_reportada %}
      <div class="section">
        <div class="section-title">Requerimiento</div>
        <div class="falla-box">{{ order.falla_reportada }}</div>
      </div>
      {% endif %}

      {% if items_text %}
      <div class="section">
        <div class="section-title">Ítems de Afilado</div>
        <div class="falla-box">{{ items_text }}</div>
      </div>
      {% endif %}
    </div>
  </div>

      <div class="nota">
    <strong>Nota:</strong> Conserve este comprobante para retiro del equipo.
    Tiempo estimado de entrega: <strong>4 días hábiles</strong> (sujeto a diagnóstico y disponibilidad de repuestos).
  </div>

  <div class="footer">
    <p>Taller Aruca Maquinarias © {{ anio }}</p>
  </div>
</div>

<button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir Comprobante</button>
</body>
</html>
"""


@work_orders_bp.route('/<int:id>/comprobante', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico')
def comprobante(id):
    order = WorkOrder.query.get_or_404(id)
    client = Client.query.get(order.cliente_id) if order.cliente_id else None
    equip = Equipment.query.get(order.equipo_id) if order.equipo_id else None
    from utils import now_ve
    anio = now_ve().year
    items_text = ''
    if order.item_seleccionado:
        try:
            items = json.loads(order.item_seleccionado)
            items_text = '\n'.join(f'• {item}' for item in items)
        except:
            items_text = order.item_seleccionado
    return render_template_string(COMPROBANTE_HTML, order=order, client=client, equip=equip, anio=anio, items_text=items_text)
