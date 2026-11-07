from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import selectinload
from models.work_order import WorkOrder
from .auth import role_required

reports_bp = Blueprint('reports', __name__)

REPORTES = {
    'recibido': {
        'titulo': 'Equipos Recibidos',
        'descripcion': 'Equipos que ingresaron al taller y aún no han sido diagnosticados.',
        'estados': ['Recibido'],
    },
    'listo': {
        'titulo': 'Equipos Listos para Entrega',
        'descripcion': 'Equipos reparados y revisados, listos para ser retirados por el cliente.',
        'estados': ['Listo para Entrega'],
    },
    'reparadas': {
        'titulo': 'Máquinas Reparadas y Revisadas',
        'descripcion': 'Equipos en reparación, listos para entrega o ya entregados.',
        'estados': ['En Reparación', 'Listo para Entrega', 'Entregado'],
    },
}


def parse_fecha(valor, fin_de_dia=False):
    if not valor:
        return None
    try:
        fecha = datetime.strptime(valor, '%Y-%m-%d')
    except (ValueError, TypeError):
        return None
    if fin_de_dia:
        fecha = fecha + timedelta(days=1)
    return fecha


@reports_bp.route('/<tipo>', methods=['GET'])
@role_required('Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico', 'Pagos')
def get_report(tipo):
    reporte = REPORTES.get(tipo)
    if not reporte:
        return jsonify({'error': 'Reporte no válido'}), 400

    query = WorkOrder.query.options(
        selectinload(WorkOrder.client),
        selectinload(WorkOrder.equipment),
        selectinload(WorkOrder.receiver),
    ).filter(WorkOrder.estado.in_(reporte['estados']))

    desde = parse_fecha(request.args.get('desde'))
    hasta = parse_fecha(request.args.get('hasta'), fin_de_dia=True)
    if desde:
        query = query.filter(WorkOrder.fecha_ingreso >= desde)
    if hasta:
        query = query.filter(WorkOrder.fecha_ingreso < hasta)

    ordenes = query.order_by(WorkOrder.fecha_ingreso.desc()).all()

    data = []
    for o in ordenes:
        cliente = o.client
        equipo = o.equipment
        data.append({
            'id': o.id,
            'numero_ot': o.numero_ot,
            'codigo_corto': o.codigo_corto,
            'estado': o.estado,
            'prioridad': o.prioridad,
            'tipo_servicio': o.tipo_servicio,
            'fecha_ingreso': o.fecha_ingreso.isoformat() if o.fecha_ingreso else None,
            'cliente_nombre': cliente.nombre if cliente else '',
            'cliente_telefono': cliente.telefono if cliente else '',
            'cliente_empresa': cliente.empresa if cliente else '',
            'equipo': f"{equipo.tipo_equipo} {equipo.marca} {equipo.modelo}" if equipo else '',
            'numero_serie': equipo.numero_serie if equipo else '',
            'falla_reportada': o.falla_reportada,
            'notas_tecnicas': o.notas_tecnicas,
            'recepcionista': o.receiver.nombre if o.receiver else '',
        })

    conteo_estados = {}
    for o in data:
        conteo_estados[o['estado']] = conteo_estados.get(o['estado'], 0) + 1

    return jsonify({
        'tipo': tipo,
        'titulo': reporte['titulo'],
        'descripcion': reporte['descripcion'],
        'estados': reporte['estados'],
        'desde': request.args.get('desde'),
        'hasta': request.args.get('hasta'),
        'total': len(data),
        'conteo_estados': conteo_estados,
        'ordenes': data,
    })
