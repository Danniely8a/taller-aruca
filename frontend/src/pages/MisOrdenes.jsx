import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ESTADOS_AFILADO = ['Recibido', 'Afilando (En Proceso)', 'Listo para Entrega', 'Entregado'];
const ESTADOS_REPARACION = ['Recibido', 'En Diagnóstico / Presupuesto', 'Listo para Entrega', 'Entregado'];
const ESTADOS_COLORES = {
  'Recibido': 'badge-info',
  'Afilando (En Proceso)': 'badge-warning',
  'En Diagnóstico / Presupuesto': 'badge-warning',
  'Listo para Entrega': 'badge-success',
  'Entregado': 'badge-success',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function esMismaFecha(fecha1, fecha2) {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function esMismaSemana(fecha) {
  const ahora = new Date();
  const d = new Date(fecha);
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1);
  inicioSemana.setHours(0, 0, 0, 0);
  return d >= inicioSemana;
}

export default function MisOrdenes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [vista, setVista] = useState('todas');
  const [filtroItems, setFiltroItems] = useState('todos');
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().toISOString().split('T')[0]);
  const printRef = useRef(null);

  useEffect(() => { cargarOrdenes(); }, []);

  useEffect(() => {
    const timer = setInterval(cargarOrdenes, 30000);
    return () => clearInterval(timer);
  }, []);

  const cargarOrdenes = async () => {
    try {
      const res = await workOrders.getMisOrdenes();
      setOrdenes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cambiarEstado = async (orderId, nuevoEstado) => {
    try {
      await workOrders.updateEstado(orderId, { nuevo_estado: nuevoEstado, usuario_id: user.id });
      toast.success(`Estado cambiado a: ${nuevoEstado}`);
      cargarOrdenes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const toggleItemListo = async (orderId, itemNombre, itemsSeleccionados, itemsListosActuales) => {
    let nuevosListos;
    if (itemsListosActuales.includes(itemNombre)) {
      nuevosListos = itemsListosActuales.filter(i => i !== itemNombre);
    } else {
      nuevosListos = [...itemsListosActuales, itemNombre];
    }
    try {
      await workOrders.updateItemsListos(orderId, { items_listos: nuevosListos });
      toast.success(itemsListosActuales.includes(itemNombre) ? 'Item marcado como pendiente' : 'Item marcado como listo ✓');
      cargarOrdenes();
    } catch (err) {
      toast.error('Error al actualizar item');
    }
  };

  const esAfilado = user?.correo === 'carlos@gmail.com';
  const tipoLabel = esAfilado ? 'Afilado' : 'Reparaciones';
  const ESTADOS_USUARIO = esAfilado ? ESTADOS_AFILADO : ESTADOS_REPARACION;

  const ordenesDia = ordenes.filter(o => esMismaFecha(o.fecha_ingreso, diaSeleccionado));
  const ordenesSemana = ordenes.filter(o => esMismaSemana(o.fecha_ingreso));

  const totalItemsSemana = {};
  let totalListosSemana = 0;
  ordenesSemana.forEach(o => {
    if (o.items_listos && Array.isArray(o.items_listos)) {
      o.items_listos.forEach(item => {
        totalItemsSemana[item] = (totalItemsSemana[item] || 0) + 1;
        totalListosSemana++;
      });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="top-bar">
        <h1>Mis Órdenes de {tipoLabel}</h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${vista === 'todas' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setVista('todas')}
        >
          Todas las Órdenes
        </button>
        <button
          className={`btn ${vista === 'diario' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setVista('diario')}
        >
          📅 Reporte Diario
        </button>
        <button
          className={`btn ${vista === 'semanal' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setVista('semanal')}
        >
          📊 Reporte Semanal
        </button>
      </div>

      {vista === 'todas' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span>Órdenes Asignadas ({ordenes.length})</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFiltroItems('todos')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: filtroItems === 'todos' ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                  background: filtroItems === 'todos' ? 'var(--primary-bg)' : 'white',
                  color: filtroItems === 'todos' ? 'var(--primary)' : 'var(--gray-500)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroItems('pendientes')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: filtroItems === 'pendientes' ? '2px solid #D97706' : '1px solid var(--gray-200)',
                  background: filtroItems === 'pendientes' ? '#FEF3C7' : 'white',
                  color: filtroItems === 'pendientes' ? '#D97706' : 'var(--gray-500)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                ⏳ Pendientes
              </button>
              <button
                onClick={() => setFiltroItems('listos')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: filtroItems === 'listos' ? '2px solid #059669' : '1px solid var(--gray-200)',
                  background: filtroItems === 'listos' ? '#D1FAE5' : 'white',
                  color: filtroItems === 'listos' ? '#059669' : 'var(--gray-500)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                ✓ Listos
              </button>
            </div>
          </div>
          {ordenes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No hay órdenes asignadas</p>
            </div>
          ) : (
            <div className="progress-list">
              {ordenes.filter(o => {
                const items = o.item_seleccionado || [];
                const itemsListos = o.items_listos || [];
                const todosListos = items.length > 0 && items.every(i => itemsListos.includes(i.item || i));
                if (filtroItems === 'pendientes') return !todosListos;
                if (filtroItems === 'listos') return todosListos && items.length > 0;
                return true;
              }).map((o) => {
                const items = o.item_seleccionado || [];
                const itemsListos = o.items_listos || [];
                const todosListos = items.length > 0 && items.every(i => itemsListos.includes(i.item || i));

                return (
                  <div key={o.id} style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--gray-100)',
                    background: o.estado === 'Recibido' ? '#fff3e0' : 'white',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{o.numero_ot}</strong>
                        <span style={{ color: 'var(--gray-400)', marginLeft: '8px', fontSize: '0.85rem' }}>{o.codigo_corto}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: o.prioridad === 'Urgente' ? '#FEE2E2' : o.prioridad === 'Alta' ? '#FEF3C7' : '#E0F2FE',
                          color: o.prioridad === 'Urgente' ? '#DC2626' : o.prioridad === 'Alta' ? '#D97706' : '#0369A1'
                        }}>
                          {o.prioridad === 'Normal' ? '📋' : o.prioridad === 'Alta' ? '⚠️' : '🔴'} {o.prioridad}
                        </span>
                        <span className={`badge ${ESTADOS_COLORES[o.estado]}`}>{o.estado}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', margin: '4px 0' }}>
                      <strong>Cliente:</strong> {o.cliente?.nombre}
                      {o.cliente?.empresa && ` - ${o.cliente.empresa}`}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: '4px 0' }}>
                      <strong>Fecha:</strong> {formatearFecha(o.fecha_ingreso)}
                    </p>

                    {items.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '12px', background: todosListos ? '#f0fdf4' : 'var(--primary-bg)', borderRadius: '10px', border: todosListos ? '1px solid #86efac' : '1px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '0.85rem', color: todosListos ? '#166534' : 'var(--primary)' }}>
                            {todosListos ? '✓ Todos los items listos' : 'Ítems a Afilar:'}
                          </strong>
                          {items.length > 0 && (
                            <span style={{ fontSize: '0.75rem', color: todosListos ? '#166534' : 'var(--primary)', fontWeight: 600 }}>
                              {itemsListos.length}/{items.length} listos
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {items.map((item, idx) => {
                            const nombre = item.item || item;
                            const cant = item.cantidad || 1;
                            const estaListo = itemsListos.includes(nombre);

                            return (
                              <div
                                key={idx}
                                onClick={() => toggleItemListo(o.id, nombre, items, itemsListos)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 12px',
                                  background: estaListo ? '#dcfce7' : 'white',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  border: `2px solid ${estaListo ? '#22c55e' : '#e5e7eb'}`,
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '6px',
                                  border: `2px solid ${estaListo ? '#22c55e' : '#9ca3af'}`,
                                  background: estaListo ? '#22c55e' : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  flexShrink: 0
                                }}>
                                  {estaListo && '✓'}
                                </div>
                                <span style={{ flex: 1, fontSize: '0.88rem', color: estaListo ? '#166534' : '#374151', fontWeight: 500, textDecoration: estaListo ? 'line-through' : 'none' }}>
                                  {nombre}
                                </span>
                                <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
                                  ×{cant}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => navigate(`/ordenes/${o.id}`)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          border: '1px solid var(--primary)',
                          borderRadius: '6px',
                          background: 'var(--primary-bg)',
                          cursor: 'pointer',
                          color: 'var(--primary)',
                          fontWeight: 600,
                        }}
                      >
                        Ver Detalle
                      </button>
                      {ESTADOS_USUARIO.filter(e => e !== o.estado).map((estado) => (
                        <button
                          key={estado}
                          className="btn btn-sm"
                          onClick={() => cambiarEstado(o.id, estado)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            border: '1px solid var(--gray-200)',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: 'pointer',
                            color: 'var(--gray-600)',
                          }}
                        >
                          → {estado}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {vista === 'diario' && (
        <div>
          <div ref={printRef}>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Órdenes del Día</span>
                <input
                  type="date"
                  value={diaSeleccionado}
                  onChange={(e) => setDiaSeleccionado(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ padding: '12px 16px' }}>
              {ordenesDia.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <p>No hay órdenes para este día</p>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '12px 16px', background: 'var(--primary-bg)', borderRadius: '8px', marginBottom: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                    {ordenesDia.length} orden(es) recibida(s) el {formatearFecha(diaSeleccionado)}
                  </div>
                  {(() => {
                    const totalDia = {};
                    let totalCantDia = 0;
                    let listosDia = 0;
                    ordenesDia.forEach(o => {
                      if (o.items_listos && Array.isArray(o.items_listos)) {
                        o.items_listos.forEach(item => {
                          totalDia[item] = (totalDia[item] || 0) + 1;
                          totalCantDia++;
                          listosDia++;
                        });
                      }
                    });
                    return Object.keys(totalDia).length > 0 && (
                      <div style={{ padding: '14px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #a5d6a7', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: '#2e7d32', marginBottom: '8px', fontWeight: 700 }}>
                          Total del Día: {ordenesDia.length} orden(es) — {listosDia} ítem(s) listos
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #a5d6a7' }}>
                              <th style={{ textAlign: 'left', padding: '4px 0', fontSize: '0.82rem', color: '#2e7d32' }}>Ítem</th>
                              <th style={{ textAlign: 'center', padding: '4px 0', fontSize: '0.82rem', color: '#2e7d32', width: '60px' }}>Cant.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(totalDia).map(([item, count]) => (
                              <tr key={item} style={{ borderBottom: '1px solid #c8e6c9' }}>
                                <td style={{ padding: '4px 0', fontSize: '0.82rem' }}>{item}</td>
                                <td style={{ textAlign: 'center', padding: '4px 0', fontWeight: 700, color: '#2e7d32' }}>{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                  {ordenesDia.map((o) => (
                    <div key={o.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--primary)' }}>{o.numero_ot}</strong>
                        <span className={`badge ${ESTADOS_COLORES[o.estado]}`}>{o.estado}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', margin: '4px 0' }}>{o.cliente?.nombre}</p>
                      {o.items_listos && o.items_listos.length > 0 && (
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {o.items_listos.map((item, idx) => (
                            <li key={idx} style={{ fontSize: '0.82rem', color: '#2e7d32' }}>✓ {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>

          {ordenesDia.length > 0 && (
            <button className="btn btn-primary btn-lg" onClick={handlePrint} style={{ width: '100%', marginTop: '16px' }}>
              🖨️ Imprimir Reporte Diario
            </button>
          )}
        </div>
      )}

      {vista === 'semanal' && (
        <div>
          <div ref={printRef}>
            <div className="card" style={{ border: '2px solid var(--gray-300)' }}>
              <div className="card-header" style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
                Reporte Semanal de {tipoLabel}
                <div style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--gray-500)', marginTop: '4px' }}>
                  Semana del {formatearFecha(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)))}
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--gray-700)', marginBottom: '12px' }}>
                  Órdenes Procesadas: {ordenesSemana.length}
                </h3>

                {totalListosSemana > 0 && (
                  <div style={{ marginBottom: '12px', padding: '10px', background: '#e8f5e9', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', color: '#2e7d32' }}>
                    Total ítems listos para pagar: {totalListosSemana}
                  </div>
                )}

                {ordenesSemana.map((o) => (
                  <div key={o.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{o.numero_ot}</strong>
                      <span className={`badge ${ESTADOS_COLORES[o.estado]}`}>{o.estado}</span>
                    </div>
                    <p style={{ color: 'var(--gray-600)', margin: '2px 0' }}>{o.cliente?.nombre}</p>
                    {o.items_listos && o.items_listos.length > 0 && (
                      <p style={{ color: '#2e7d32', fontSize: '0.8rem', fontWeight: 600 }}>
                        Listos: {o.items_listos.join(', ')}
                      </p>
                    )}
                  </div>
                ))}

                {Object.keys(totalItemsSemana).length > 0 && (
                  <div style={{ marginTop: '16px', padding: '14px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #a5d6a7' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#2e7d32', marginBottom: '10px', fontWeight: 700 }}>
                      Total de Ítems Listos para Pago
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #a5d6a7' }}>
                          <th style={{ textAlign: 'left', padding: '6px 0', fontSize: '0.85rem', color: '#2e7d32' }}>Ítem</th>
                          <th style={{ textAlign: 'center', padding: '6px 0', fontSize: '0.85rem', color: '#2e7d32' }}>Veces</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(totalItemsSemana).map(([item, count]) => (
                          <tr key={item} style={{ borderBottom: '1px solid #c8e6c9' }}>
                            <td style={{ padding: '6px 0', fontSize: '0.85rem' }}>{item}</td>
                            <td style={{ textAlign: 'center', padding: '6px 0', fontWeight: 700, fontSize: '0.95rem', color: '#2e7d32' }}>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #2e7d32', fontWeight: 700 }}>
                          <td style={{ padding: '8px 0', fontSize: '0.9rem' }}>TOTAL:</td>
                          <td style={{ textAlign: 'center', padding: '8px 0', fontSize: '1.1rem', color: '#2e7d32' }}>
                            {totalListosSemana}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {ordenesSemana.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>No hay órdenes esta semana</p>
                  </div>
                )}

                <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.75rem' }}>
                  Taller Aruca Maquinarias — Carlos Perez
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handlePrint} style={{ width: '100%', marginTop: '16px' }}>
            🖨️ Imprimir Reporte
          </button>
        </div>
      )}
    </div>
  );
}
