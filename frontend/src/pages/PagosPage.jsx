import { useState, useEffect } from 'react';
import { pagosSemanales } from '../api';
import { useAuth } from '../context/AuthContext';

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatFecha(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PagosPage() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(getMonday(new Date()));
  const [observaciones, setObservaciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    cargarPagos();
  }, []);

  useEffect(() => {
    const timer = setInterval(cargarPagos, 30000);
    return () => clearInterval(timer);
  }, []);

  const cargarPagos = async () => {
    try {
      const res = await pagosSemanales.getAll();
      setPagos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    try {
      await pagosSemanales.generar({ semana_inicio: semanaSeleccionada });
      setMsg({ tipo: 'success', texto: 'Reporte semanal generado' });
      await cargarPagos();
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al generar' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleValidar = async (id) => {
    try {
      await pagosSemanales.validar(id, { observaciones: observaciones[id] || '' });
      setMsg({ tipo: 'success', texto: '✓ Pago validado exitosamente' });
      await cargarPagos();
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al validar' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este reporte?')) return;
    try {
      await pagosSemanales.delete(id);
      setMsg({ tipo: 'success', texto: 'Eliminado' });
      await cargarPagos();
    } catch (err) {
      setMsg({ tipo: 'error', texto: 'Error al eliminar' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const pagosNoValidados = pagos.filter(p => !p.validado);
  const pagosValidados = pagos.filter(p => p.validado);

  return (
    <div style={{ padding: '0' }}>
      {/* Header moderno con gradiente */}
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
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          right: '60px',
          width: '100px',
          height: '100px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%'
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Pagos a Técnicos
            </h1>
            <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>Validar y registrar pagos semanales de servicios</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.3)'; e.target.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'translateY(0)'; }}
          >
            {showForm ? '✕ Cerrar' : '+ Generar Reporte'}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
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
          <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendientes</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>{pagosNoValidados.length}</div>
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #059669, #10B981)' }} />
          <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pagados</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>{pagosValidados.length}</div>
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #003A8C, #4A90D9)' }} />
          <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Registros</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#003A8C' }}>{pagos.length}</div>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          background: msg.tipo === 'error' ? '#FEE2E2' : '#D1FAE5',
          color: msg.tipo === 'error' ? '#991B1B' : '#065F46',
          border: `1px solid ${msg.tipo === 'error' ? '#FECACA' : '#A7F3D0'}`,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideUp 0.3s ease'
        }}>
          {msg.tipo === 'error' ? '⚠️' : '✓'} {msg.texto}
        </div>
      )}

      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
          animation: 'slideUp 0.3s ease'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #059669, #10B981)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1rem'
            }}>+</span>
            Generar Reporte Semanal
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>
            Selecciona la semana a reportar. El sistema calculará automáticamente el total de órdenes e ítems procesados por Carlos.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Semana que inicia:</label>
              <input
                type="date"
                value={semanaSeleccionada}
                onChange={(e) => setSemanaSeleccionada(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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
            <button
              onClick={handleGenerar}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
                transition: 'all 0.3s',
                marginTop: '20px'
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(5,150,105,0.4)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(5,150,105,0.3)'; }}
            >
              Generar Reporte
            </button>
          </div>
        </div>
      )}

      {/* Pendientes */}
      {pagosNoValidados.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#92400E',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              background: '#FEF3C7',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '1.1rem'
            }}>⏳</span>
            Pendientes de Validación
          </h2>
          {pagosNoValidados.map(p => (
            <PagoCard key={p.id} pago={p} esValidado={false} observaciones={observaciones} setObservaciones={setObservaciones} onValidar={handleValidar} onDelete={handleDelete} user={user} />
          ))}
        </div>
      )}

      {/* Validados */}
      {pagosValidados.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#065F46',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              background: '#D1FAE5',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '1.1rem'
            }}>✓</span>
            Pagos Validados
          </h2>
          {pagosValidados.map(p => (
            <PagoCard key={p.id} pago={p} esValidado={true} onValidar={handleValidar} onDelete={handleDelete} user={user} />
          ))}
        </div>
      )}

      {pagos.length === 0 && !loading && (
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
          }}>💰</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>No hay reportes aún</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Genera tu primer reporte semanal con el botón de arriba para comenzar a registrar pagos.
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function PagoCard({ pago, esValidado, observaciones, setObservaciones, onValidar, onDelete, user }) {
  const [hover, setHover] = useState(false);
  const items = pago.total_items ? JSON.parse(pago.total_items) : {};
  const esGerente = user?.rol === 'Gerente General';

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        marginBottom: '16px',
        boxShadow: hover ? '0 8px 30px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.06)',
        border: `1px solid ${esValidado ? '#A7F3D0' : '#E5E7EB'}`,
        borderLeft: `5px solid ${esValidado ? '#059669' : '#F59E0B'}`,
        transition: 'all 0.3s',
        transform: hover ? 'translateY(-2px)' : 'none',
        opacity: esValidado ? 0.9 : 1,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {esValidado && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'linear-gradient(135deg, #059669, #10B981)',
          color: 'white',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.02em'
        }}>✓ PAGADO</div>
      )}

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                background: esValidado ? '#D1FAE5' : '#FEF3C7',
                color: esValidado ? '#065F46' : '#92400E',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {formatFecha(pago.semana_inicio)} — {formatFecha(pago.semana_fin)}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0 }}>
              Técnico: <strong style={{ color: '#1F2937' }}>{pago.tecnico_nombre}</strong>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: '#F3F4F6',
            padding: '12px 16px',
            borderRadius: '10px',
            flex: 1,
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Órdenes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#003A8C' }}>{pago.total_ordenes}</div>
          </div>
          <div style={{
            background: '#F3F4F6',
            padding: '12px 16px',
            borderRadius: '10px',
            flex: 1,
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ítems</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{pago.total_cantidad}</div>
          </div>
        </div>

        {/* Items */}
        {Object.keys(items).length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Detalle de ítems:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(items).map(([item, cant]) => (
                <span key={item} style={{
                  background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                  border: '1px solid #BFDBFE',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: '#1E40AF'
                }}>
                  {item} <span style={{ fontWeight: 700 }}>×{cant}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Validación info */}
        {esValidado && (
          <div style={{
            background: '#ECFDF5',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid #A7F3D0'
          }}>
            <p style={{ fontSize: '0.82rem', color: '#065F46', margin: 0 }}>
              <strong>Validado por:</strong> {pago.validado_nombre}
              {pago.fecha_validacion && (
                <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                  — {formatFecha(pago.fecha_validacion.split('T')[0])}
                </span>
              )}
            </p>
            {pago.observaciones && (
              <p style={{ fontSize: '0.82rem', color: '#047857', margin: '6px 0 0', fontStyle: 'italic' }}>
                "{pago.observaciones}"
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
        {!esValidado && esGerente && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
            borderTop: '1px solid #F3F4F6',
            paddingTop: '16px'
          }}>
            <input
              type="text"
              placeholder="Observaciones (opcional)..."
              value={observaciones?.[pago.id] || ''}
              onChange={(e) => setObservaciones({ ...observaciones, [pago.id]: e.target.value })}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '10px 14px',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 4px rgba(5,150,105,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={() => onValidar(pago.id)}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(5,150,105,0.4)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(5,150,105,0.3)'; }}
            >
              ✓ Validar Pago
            </button>
            <button
              onClick={() => onDelete(pago.id)}
              style={{
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                padding: '10px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = '#FCA5A5'; }}
              onMouseLeave={e => { e.target.style.background = '#FEE2E2'; }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PagosPage;
