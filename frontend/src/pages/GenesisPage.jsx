import { useState, useEffect } from 'react';
import { workOrders } from '../api';
import toast from 'react-hot-toast';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function GenesisPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

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
      toast.error('Error al cargar órdenes');
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

  const ordenesConListos = ordenes.filter(o => {
    const tieneListos = o.items_listos && o.items_listos.length > 0;
    const coincideBusqueda = !busqueda ||
      o.numero_ot?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.codigo_corto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase());
    return tieneListos && coincideBusqueda;
  });

  const totalValidadosGlobal = {};
  let totalCantValidados = 0;
  let totalCantListos = 0;
  ordenesConListos.forEach(o => {
    const itemsValidados = o.items_validados || [];
    const itemsListos = o.items_listos || [];
    itemsListos.forEach(item => {
      totalCantListos++;
      if (itemsValidados.includes(item)) {
        totalValidadosGlobal[item] = (totalValidadosGlobal[item] || 0) + 1;
        totalCantValidados++;
      }
    });
  });

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
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
            Validación de Ítems
          </h1>
          <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>Valida los items que Carlos marcó como listos para pago</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #059669, #10B981)' }} />
          <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Órdenes</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>{ordenesConListos.length}</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }} />
          <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Listos</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>{totalCantListos}</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }} />
          <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Validados</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7C3AED' }}>{totalCantValidados}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>🔍</span>
          <input
            placeholder="Buscar por OT, código o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 4px rgba(5,150,105,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Lista de órdenes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ordenesConListos.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2rem'
            }}>⏳</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>No hay items para validar</h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Carlos debe marcar items como listos para que aparezcan aquí</p>
          </div>
        )}

        {ordenesConListos.map(o => (
          <OrdenCard key={o.id} orden={o} onToggleValidar={toggleItemValidado} />
        ))}
      </div>

      {/* Resumen global */}
      {Object.keys(totalValidadosGlobal).length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '2px solid #7C3AED'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#7C3AED', marginBottom: '16px' }}>💰 Resumen de Items Validados para Pago</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #7C3AED' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.78rem', fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ítem</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '0.78rem', fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cantidad Validada</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalValidadosGlobal).sort((a, b) => b[1] - a[1]).map(([item, cant]) => (
                <tr key={item} style={{ borderBottom: '1px solid #EDE9FE' }}>
                  <td style={{ padding: '12px', fontSize: '0.9rem', color: '#374151' }}>{item}</td>
                  <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700, fontSize: '1rem', color: '#7C3AED' }}>{cant}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #7C3AED', fontWeight: 700 }}>
                <td style={{ padding: '14px 12px', fontSize: '0.95rem', color: '#1F2937' }}>TOTAL VALIDADO:</td>
                <td style={{ textAlign: 'center', padding: '14px 12px', fontSize: '1.3rem', color: '#7C3AED' }}>{totalCantValidados}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
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
            <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Items Listos por Carlos — Valida para Pago:</strong>
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
