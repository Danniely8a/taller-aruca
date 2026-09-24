import { useState, useEffect, useMemo } from 'react';
import { workOrders } from '../api';
import toast from 'react-hot-toast';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function claveDia(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function etiquetaDia(clave) {
  if (!clave) return '';
  const [y, m, d] = clave.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short' });
}

function rangoPeriodo(periodo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(hoy);
  finHoy.setHours(23, 59, 59, 999);

  if (periodo === 'hoy') {
    return { desde: hoy, hasta: finHoy };
  }
  if (periodo === 'semana') {
    const desde = getMonday(hoy);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 6);
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta };
  }
  return { desde: null, hasta: null };
}

function GenesisPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [periodo, setPeriodo] = useState('hoy');

  useEffect(() => {
    cargarOrdenes();
  }, []);

  useEffect(() => {
    const timer = setInterval(cargarOrdenes, 30000);
    return () => clearInterval(timer);
  }, []);

  const cargarOrdenes = async () => {
    try {
      const res = await workOrders.getOrdenesItems();
      setOrdenes(res.data);
    } catch (err) {
      toast.error('Error al cargar órdenes', { id: 'load-ordenes' });
    } finally {
      setLoading(false);
    }
  };

  const toggleItemValidado = async (orderId, itemNombre, itemsValidadosActuales) => {
    let nuevosValidados;
    if (itemsValidadosActuales.includes(itemNombre)) {
      nuevosValidados = itemsValidadosActuales.filter(i => i !== itemNombre);
    } else {
      nuevosValidados = [...itemsValidadosActuales, itemNombre];
    }
    try {
      await workOrders.updateItemsValidados(orderId, { items_validados: nuevosValidados });
      toast.success(itemsValidadosActuales.includes(itemNombre) ? 'Item desvalidado' : 'Item validado ✓');
      cargarOrdenes();
    } catch (err) {
      toast.error('Error al validar item');
    }
  };

  const { desde, hasta } = useMemo(() => rangoPeriodo(periodo), [periodo]);

  const ordenesPeriodo = useMemo(() => {
    return ordenes.filter(o => {
      if (!o.fecha_ingreso) return false;
      const f = new Date(o.fecha_ingreso);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }, [ordenes, desde, hasta]);

  const ordenesConListos = useMemo(() => {
    return ordenesPeriodo.filter(o => {
      const tieneListos = o.items_listos && o.items_listos.length > 0;
      const coincideBusqueda = !busqueda ||
        o.numero_ot?.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.codigo_corto?.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase());
      return tieneListos && coincideBusqueda;
    });
  }, [ordenesPeriodo, busqueda]);

  const hojaProduccion = useMemo(() => {
    const totals = {};
    let totalListos = 0;
    let totalValidados = 0;
    ordenesConListos.forEach(o => {
      const itemsValidados = o.items_validados || [];
      const itemsListos = o.items_listos || [];
      itemsListos.forEach(item => {
        if (!totals[item]) totals[item] = { listos: 0, validados: 0 };
        totals[item].listos += 1;
        totalListos += 1;
        if (itemsValidados.includes(item)) {
          totals[item].validados += 1;
          totalValidados += 1;
        }
      });
    });
    return { totals, totalListos, totalValidados };
  }, [ordenesConListos]);

  const resumenPorDia = useMemo(() => {
    const map = {};
    ordenesPeriodo.forEach(o => {
      const clave = claveDia(o.fecha_ingreso);
      if (!clave) return;
      if (!map[clave]) {
        map[clave] = { clave, ordenes: 0, listos: 0, validados: 0, afilado: 0, reparacion: 0 };
      }
      map[clave].ordenes += 1;
      if (o.tipo_servicio === 'Afilado') map[clave].afilado += 1;
      else map[clave].reparacion += 1;
      const listos = o.items_listos || [];
      const validados = o.items_validados || [];
      map[clave].listos += listos.length;
      map[clave].validados += listos.filter(i => validados.includes(i)).length;
    });
    return Object.values(map).sort((a, b) => b.clave.localeCompare(a.clave));
  }, [ordenesPeriodo]);

  const totalValidadosGlobal = hojaProduccion.totals;

  return (
    <div style={{ padding: '0' }}>
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '28px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Afilado — Producción
          </h1>
          <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>Validación de ítems y resumen diario / semanal</p>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Período</span>
        {[
          { id: 'hoy', label: 'Hoy' },
          { id: 'semana', label: 'Esta semana' },
          { id: 'todo', label: 'Todo' },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: periodo === p.id ? '2px solid #059669' : '2px solid #E5E7EB',
              background: periodo === p.id ? '#D1FAE5' : 'white',
              color: periodo === p.id ? '#059669' : '#6B7280',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {p.label}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <input
            placeholder="Buscar por OT, código o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>🔍</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Órdenes" value={ordenesPeriodo.length} color="#059669" grad={['#059669', '#10B981']} />
        <StatCard label="Afilado" value={ordenesPeriodo.filter(o => o.tipo_servicio === 'Afilado').length} color="#0369A1" grad={['#0369A1', '#38BDF8']} />
        <StatCard label="Listos" value={hojaProduccion.totalListos} color="#F59E0B" grad={['#F59E0B', '#FBBF24']} />
        <StatCard label="Validados" value={hojaProduccion.totalValidados} color="#7C3AED" grad={['#7C3AED', '#A78BFA']} />
      </div>

      {resumenPorDia.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#059669', marginBottom: '16px' }}>
            📅 Resumen de órdenes {periodo === 'hoy' ? 'del día' : periodo === 'semana' ? 'de la semana' : ''}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #059669' }}>
                  {['Día', 'Órdenes', 'Afilado', 'Reparación', 'Ítems listos', 'Validados'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Día' ? 'left' : 'center', padding: '10px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumenPorDia.map(r => (
                  <tr key={r.clave} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{etiquetaDia(r.clave)}</td>
                    <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700 }}>{r.ordenes}</td>
                    <td style={{ textAlign: 'center', padding: '12px', color: '#0369A1', fontWeight: 600 }}>{r.afilado}</td>
                    <td style={{ textAlign: 'center', padding: '12px', color: '#6B7280' }}>{r.reparacion}</td>
                    <td style={{ textAlign: 'center', padding: '12px', color: '#F59E0B', fontWeight: 700 }}>{r.listos}</td>
                    <td style={{ textAlign: 'center', padding: '12px', color: '#7C3AED', fontWeight: 700 }}>{r.validados}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #059669', fontWeight: 700 }}>
                  <td style={{ padding: '12px 8px' }}>TOTAL</td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>{resumenPorDia.reduce((s, r) => s + r.ordenes, 0)}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#0369A1' }}>{resumenPorDia.reduce((s, r) => s + r.afilado, 0)}</td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>{resumenPorDia.reduce((s, r) => s + r.reparacion, 0)}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#F59E0B' }}>{resumenPorDia.reduce((s, r) => s + r.listos, 0)}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#7C3AED' }}>{resumenPorDia.reduce((s, r) => s + r.validados, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {Object.keys(totalValidadosGlobal).length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '2px solid #059669'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>🏭 Hoja de producción {periodo === 'hoy' ? 'del día' : periodo === 'semana' ? 'de la semana' : ''}</h3>
            <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨️ Imprimir</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #059669' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Ítem</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Listos</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Validados</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalValidadosGlobal).sort((a, b) => b[1].validados - a[1].validados || b[1].listos - a[1].listos).map(([item, cant]) => (
                <tr key={item} style={{ borderBottom: '1px solid #ECFDF5' }}>
                  <td style={{ padding: '12px', fontSize: '0.9rem', color: '#374151' }}>{item}</td>
                  <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: '#F59E0B' }}>{cant.listos}</td>
                  <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: '#7C3AED' }}>{cant.validados}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #059669', fontWeight: 700 }}>
                <td style={{ padding: '14px 12px' }}>TOTAL:</td>
                <td style={{ textAlign: 'center', padding: '14px 12px', fontSize: '1.2rem', color: '#F59E0B' }}>{hojaProduccion.totalListos}</td>
                <td style={{ textAlign: 'center', padding: '14px 12px', fontSize: '1.2rem', color: '#7C3AED' }}>{hojaProduccion.totalValidados}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '8px 0 0' }}>
          Ítems para validar ({ordenesConListos.length})
        </h3>
        {ordenesConListos.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>Sin ítems en este período</h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Cambia el período o espera a que Carlos marque ítems como listos</p>
          </div>
        )}
        {ordenesConListos.map(o => (
          <OrdenCard key={o.id} orden={o} onToggleValidar={toggleItemValidado} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, grad }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      border: '1px solid #E5E7EB',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${grad[0]}, ${grad[1]})` }} />
      <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function OrdenCard({ orden, onToggleValidar }) {
  const [expanded, setExpanded] = useState(true);
  const itemsListos = orden.items_listos || [];
  const itemsValidados = orden.items_validados || [];
  const todosValidados = itemsListos.length > 0 && itemsListos.every(i => itemsValidados.includes(i));

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      border: `1px solid ${todosValidados ? '#A7F3D0' : '#E5E7EB'}`,
      borderLeft: `5px solid ${todosValidados ? '#059669' : '#F59E0B'}`,
      overflow: 'hidden',
      transition: 'all 0.3s'
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: expanded ? '#FAFAFE' : 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'linear-gradient(135deg, #059669, #10B981)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>{orden.numero_ot}</span>
          <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>{orden.codigo_corto}</span>
          <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{orden.cliente_nombre}</span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{formatearFecha(orden.fecha_ingreso)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: todosValidados ? '#D1FAE5' : '#FEF3C7',
            color: todosValidados ? '#059669' : '#D97706',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {todosValidados ? '✓ Todos validados' : `${itemsValidados.length}/${itemsListos.length} validados`}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '1rem' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: '0 20px 16px',
          borderTop: '1px solid #F3F4F6'
        }}>
          <div style={{ marginTop: '12px' }}>
            <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Ítems listos — valida para pago:</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {itemsListos.map((item, idx) => {
                const estaValidado = itemsValidados.includes(item);
                return (
                  <div
                    key={idx}
                    onClick={() => onToggleValidar(orden.id, item, itemsValidados)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      background: estaValidado ? '#F0FDF4' : 'white',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: `2px solid ${estaValidado ? '#22c55e' : '#e5e7eb'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: `2px solid ${estaValidado ? '#22c55e' : '#9ca3af'}`,
                      background: estaValidado ? '#22c55e' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}>
                      {estaValidado && '✓'}
                    </div>
                    <span style={{
                      flex: 1,
                      fontSize: '0.9rem',
                      color: estaValidado ? '#166534' : '#374151',
                      fontWeight: 500,
                      textDecoration: estaValidado ? 'line-through' : 'none'
                    }}>
                      {item}
                    </span>
                    <span style={{
                      background: estaValidado ? '#D1FAE5' : '#FEF3C7',
                      color: estaValidado ? '#059669' : '#D97706',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {estaValidado ? '✓ Validado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenesisPage;
