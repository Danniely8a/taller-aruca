import { useState, useEffect } from 'react';
import { reports } from '../api';
import toast from 'react-hot-toast';

const TIPOS = [
  { key: 'recibido', label: 'Recibidos', icon: '📥', color: 'var(--info)' },
  { key: 'listo', label: 'Listos para Entrega', icon: '✅', color: 'var(--success)' },
  { key: 'reparadas', label: 'Reparadas y Revisadas', icon: '🔧', color: 'var(--warning)' },
];

const ESTADOS_COLORES = {
  'Recibido': 'badge-info',
  'En Diagnóstico': 'badge-warning',
  'En Diagnóstico / Presupuesto': 'badge-warning',
  'Esperando Presupuesto': 'badge-warning',
  'Esperando Aprobación': 'badge-warning',
  'Esperando Repuestos': 'badge-danger',
  'En Reparación': 'badge-info',
  'Afilando (En Proceso)': 'badge-warning',
  'Listo para Entrega': 'badge-success',
  'Pagado': 'badge-success',
  'Entregado': 'badge-success',
  'Devolución por Garantía': 'badge-danger',
};

export default function Reportes() {
  const [tipo, setTipo] = useState('recibido');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (overrides = {}) => {
    setLoading(true);
    const filtroDesde = overrides.desde !== undefined ? overrides.desde : desde;
    const filtroHasta = overrides.hasta !== undefined ? overrides.hasta : hasta;
    try {
      const params = {};
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const res = await reports.get(tipo, params);
      setReporte(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tipo]);

  const formatoFecha = (valor) => {
    if (!valor) return '-';
    return new Date(valor).toLocaleString();
  };

  const handleCsv = () => {
    if (!reporte || reporte.ordenes.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const headers = ['Orden', 'Código', 'Cliente', 'Teléfono', 'Empresa', 'Equipo', 'Servicio', 'Estado', 'Prioridad', 'Fecha Ingreso', 'Recepcionista'];
    const rows = reporte.ordenes.map((o) => [
      o.numero_ot,
      o.codigo_corto,
      o.cliente_nombre,
      o.cliente_telefono,
      o.cliente_empresa,
      o.equipo,
      o.tipo_servicio,
      o.estado,
      o.prioridad,
      formatoFecha(o.fecha_ingreso),
      o.recepcionista,
    ]);
    const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((fila) => fila.map(escapar).join(';')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const activo = TIPOS.find((t) => t.key === tipo);

  return (
    <div>
      <div className="top-bar with-actions no-print">
        <h1>Reportes</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleCsv} disabled={!reporte || reporte.ordenes.length === 0}>
            Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => window.print()} disabled={!reporte || reporte.ordenes.length === 0}>
            Imprimir Reporte
          </button>
        </div>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {TIPOS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTipo(t.key)}
            style={{
              textAlign: 'left',
              padding: '18px',
              borderRadius: 'var(--radius)',
              border: tipo === t.key ? `2px solid ${t.color}` : '1px solid var(--gray-200)',
              background: tipo === t.key ? 'var(--primary-bg)' : 'white',
              cursor: 'pointer',
              boxShadow: tipo === t.key ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{t.icon}</div>
            <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{t.label}</div>
          </button>
        ))}
      </div>

      <div className="card no-print" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '160px' }}>
            <label>Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '160px' }}>
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => load()} disabled={loading}>
            {loading ? 'Generando...' : 'Generar Reporte'}
          </button>
          {(desde || hasta) && (
            <button className="btn btn-outline" onClick={() => { setDesde(''); setHasta(''); load({ desde: '', hasta: '' }); }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {reporte && (
        <div className="card">
          <div className="print-only report-print-header">
            <h1 style={{ color: 'var(--primary)', fontSize: '1.6rem', marginBottom: '4px' }}>Taller Aruca</h1>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{reporte.titulo}</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{reporte.descripcion}</p>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginTop: '4px' }}>
              Generado: {new Date().toLocaleString()}
              {(desde || hasta) && ` · Rango: ${desde || 'inicio'} a ${hasta || 'hoy'}`}
              {' · '}Total: {reporte.total}
            </p>
          </div>

          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span>{activo?.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              {reporte.total} orden{reporte.total === 1 ? '' : 'es'}
              {(desde || hasta) && ` · ${desde || 'inicio'} a ${hasta || 'hoy'}`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {Object.entries(reporte.conteo_estados).map(([estado, count]) => (
              <span key={estado} className={`badge ${ESTADOS_COLORES[estado] || 'badge-info'}`}>
                {estado}: {count}
              </span>
            ))}
          </div>

          {reporte.ordenes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No hay órdenes para este reporte</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Equipo</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.ordenes.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>{o.numero_ot}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{o.codigo_corto}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{o.cliente_nombre || '-'}</div>
                        {o.cliente_empresa && <small style={{ color: 'var(--gray-400)' }}>{o.cliente_empresa}</small>}
                      </td>
                      <td>
                        {o.cliente_telefono ? (
                          <a href={`tel:${o.cliente_telefono}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            {o.cliente_telefono}
                          </a>
                        ) : '-'}
                      </td>
                      <td>
                        <div>{o.equipo || '-'}</div>
                        {o.numero_serie && <small style={{ color: 'var(--gray-400)' }}>Serie: {o.numero_serie}</small>}
                      </td>
                      <td>{o.tipo_servicio || '-'}</td>
                      <td><span className={`badge ${ESTADOS_COLORES[o.estado] || 'badge-info'}`}>{o.estado}</span></td>
                      <td>{o.prioridad}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatoFecha(o.fecha_ingreso)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="print-only" style={{ marginTop: '24px', borderTop: '1px solid var(--gray-300)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--gray-500)', textAlign: 'center' }}>
            Taller Aruca Maquinarias · Reporte generado por el sistema de recepción
          </div>
        </div>
      )}
    </div>
  );
}
