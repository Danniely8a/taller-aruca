import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workOrders, photos, qr } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import catalogo from '../data/catalogo_afilado.json';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullIndicator from '../components/PullIndicator';

const TIPOS_EQUIPO = ['Compresores', 'Pistolas para clavar', 'Engrapadoras', 'Máquinas pequeñas', 'Máquinas grandes'];
const TIPOS_SERVICIO = ['Reparación', 'Afilado'];

function obtenerTodosItems() {
  const items = [];
  for (const cat of catalogo.categorias) {
    for (const item of cat.items) {
      items.push({ categoria: cat.nombre, item });
    }
  }
  return items;
}

export default function Recepcion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenCreada, setOrdenCreada] = useState(null);
  const [form, setForm] = useState({
    nombre_cliente: '',
    cedula_rif: '',
    telefono: '',
    empresa: '',
    correo: '',
    tipo_servicio: 'Reparación',
    tipo_equipo: 'Compresores',
    marca: '',
    modelo: '',
    numero_serie: '',
    falla_reportada: '',
    prioridad: 'Normal',
  });

  const [busquedaItem, setBusquedaItem] = useState('');
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const todosItems = obtenerTodosItems();

  const ESTADOS_COLORES = {
    'Recibido': 'badge-info', 'En Diagnóstico': 'badge-warning',
    'En Diagnóstico / Presupuesto': 'badge-warning',
    'Esperando Presupuesto': 'badge-warning', 'Esperando Aprobación': 'badge-warning',
    'Esperando Repuestos': 'badge-danger', 'En Reparación': 'badge-info',
    'Listo para Entrega': 'badge-success', 'Entregado': 'badge-success',
    'Devolución por Garantía': 'badge-danger',
  };

  useEffect(() => { cargarOrdenes(); }, [busqueda]);

  useEffect(() => {
    const timer = setInterval(cargarOrdenes, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (busquedaItem.length >= 2) {
      const q = busquedaItem.toLowerCase();
      setItemsFiltrados(todosItems.filter(i => i.item.toLowerCase().includes(q) && !itemsSeleccionados.includes(i.item)).slice(0, 20));
    } else {
      setItemsFiltrados([]);
    }
  }, [busquedaItem]);

  const cargarOrdenes = async () => {
    try {
      const res = await workOrders.getAll();
      let data = res.data;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        data = data.filter(o =>
          o.cliente?.nombre?.toLowerCase().includes(q) ||
          o.cliente?.empresa?.toLowerCase().includes(q) ||
          o.codigo_corto?.toLowerCase().includes(q) ||
          o.numero_ot?.toLowerCase().includes(q)
        );
      }
      setOrdenes(data.slice(0, 20));
    } catch (err) {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, refreshing, pullDistance } = usePullToRefresh(cargarOrdenes);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await workOrders.recepcion({
        ...form,
        items_seleccionados: itemsSeleccionados,
        usuario_recepcion: user.id,
      });
      toast.success('Orden creada correctamente');
      setOrdenCreada(res.data);
      setForm({
        nombre_cliente: '',
        cedula_rif: '',
        telefono: '',
        empresa: '',
        correo: '',
        tipo_servicio: 'Reparación',
        tipo_equipo: 'Compresores',
        marca: '',
        modelo: '',
        numero_serie: '',
        falla_reportada: '',
        prioridad: 'Normal',
      });
      setItemSeleccionado('');
      setItemsSeleccionados([]);
      setBusquedaItem('');
      cargarOrdenes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear la orden');
    }
  };

  const handlePhotoUpload = async (e, orderId) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await photos.upload(orderId, file);
      toast.success('Foto subida');
      cargarOrdenes();
    } catch (err) {
      toast.error('Error al subir foto');
    }
  };

  const downloadQR = async (orderId) => {
    try {
      await qr.download(orderId);
      toast.success('QR descargado correctamente');
    } catch {
      toast.error('Error al generar el QR');
    }
  };

  const updateChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div ref={containerRef}>
      <PullIndicator refreshing={refreshing} pullDistance={pullDistance} />
      <div className="top-bar">
        <h1>Recepción de Equipos</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: user?.rol === 'Técnico' ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: '28px' }}>
        {user?.rol !== 'Técnico' && (
        <div>
          <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '24px' }}>
              Nuevo Ingreso
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-section-title">Datos del Cliente</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cédula / RIF</label>
                  <input value={form.cedula_rif} onChange={(e) => updateChange('cedula_rif', e.target.value)} placeholder="Ej: V-12345678 o J-12345678-9" />
                </div>
                <div className="form-group">
                  <label className="label-required">Teléfono</label>
                  <input value={form.telefono} onChange={(e) => updateChange('telefono', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label-required">Nombre del Cliente / Empresa</label>
                  <input value={form.nombre_cliente} onChange={(e) => updateChange('nombre_cliente', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Correo</label>
                  <input type="email" value={form.correo} onChange={(e) => updateChange('correo', e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div className="form-group">
                <label>Empresa</label>
                <input value={form.empresa} onChange={(e) => updateChange('empresa', e.target.value)} placeholder="Opcional" />
              </div>

              <div className="form-section-title" style={{ marginTop: '20px' }}>Tipo de Servicio</div>
              <div className="form-group">
                <label className="label-required">Servicio</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {TIPOS_SERVICIO.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        updateChange('tipo_servicio', s);
                        if (s === 'Reparación') {
                          setItemSeleccionado('');
                          setBusquedaItem('');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: form.tipo_servicio === s ? '2px solid var(--primary)' : '2px solid var(--gray-200)',
                        background: form.tipo_servicio === s ? 'var(--primary-bg)' : 'var(--white)',
                        color: form.tipo_servicio === s ? 'var(--primary)' : 'var(--gray-600)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {s === 'Reparación' ? '🔧' : '⚙️'} {s}
                    </button>
                  ))}
                </div>
              </div>

              {form.tipo_servicio === 'Afilado' && (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="label-required">Buscar Ítems de Afilado</label>
                  <input
                    value={busquedaItem}
                    onChange={(e) => {
                      setBusquedaItem(e.target.value);
                      setMostrarLista(true);
                    }}
                    onFocus={() => setMostrarLista(true)}
                    placeholder="Escriba para buscar... (ej: disco, cuchilla, fresa)"
                  />
                      {mostrarLista && itemsFiltrados.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'white', border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-sm)', maxHeight: '200px',
                      overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                      {itemsFiltrados.map((i, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setItemsSeleccionados([...itemsSeleccionados, { item: i.item, cantidad: 1 }]);
                            setBusquedaItem('');
                            setMostrarLista(false);
                          }}
                          style={{
                            padding: '10px 12px', cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-100)',
                            fontSize: '0.85rem',
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--primary-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                          <span style={{ fontWeight: 500 }}>{i.item}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-400)' }}>{i.categoria}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {itemsSeleccionados.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {itemsSeleccionados.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
                          <span style={{ flex: 1 }}>✓ {item.item}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevos = [...itemsSeleccionados];
                              nuevos[idx].cantidad = Math.max(1, nuevos[idx].cantidad - 1);
                              setItemsSeleccionados(nuevos);
                            }}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary)', background: 'white', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >−</button>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => {
                              const nuevaCant = parseInt(e.target.value) || 1;
                              const nuevos = [...itemsSeleccionados];
                              nuevos[idx].cantidad = nuevaCant;
                              setItemsSeleccionados(nuevos);
                            }}
                            style={{ width: '55px', padding: '4px 6px', border: '1px solid var(--primary)', borderRadius: '4px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 700 }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nuevos = [...itemsSeleccionados];
                              nuevos[idx].cantidad = nuevos[idx].cantidad + 1;
                              setItemsSeleccionados(nuevos);
                            }}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--primary)', background: 'white', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >+</button>
                          <button type="button" onClick={() => setItemsSeleccionados(itemsSeleccionados.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.tipo_servicio === 'Reparación' && (
              <>
              <div className="form-section-title" style={{ marginTop: '20px' }}>Datos del Equipo</div>
              <div className="form-group">
                <label className="label-required">Tipo de Equipo</label>
                <select value={form.tipo_equipo} onChange={(e) => updateChange('tipo_equipo', e.target.value)}>
                  {TIPOS_EQUIPO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label-required">Marca</label>
                  <input value={form.marca} onChange={(e) => updateChange('marca', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label-required">Modelo</label>
                  <input value={form.modelo} onChange={(e) => updateChange('modelo', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Número de Serie</label>
                  <input value={form.numero_serie} onChange={(e) => updateChange('numero_serie', e.target.value)} />
                </div>
              </div>
              </>
              )}

              <div className="form-section-title" style={{ marginTop: '20px' }}>Prioridad</div>
              <div className="form-group">
                <label className="label-required">Prioridad de la Orden</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Normal', 'Alta', 'Urgente'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateChange('prioridad', p)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: form.prioridad === p
                          ? `2px solid ${p === 'Urgente' ? '#DC2626' : p === 'Alta' ? '#D97706' : 'var(--primary)'}`
                          : '2px solid var(--gray-200)',
                        background: form.prioridad === p
                          ? `${p === 'Urgente' ? '#FEE2E2' : p === 'Alta' ? '#FEF3C7' : 'var(--primary-bg)'}`
                          : 'var(--white)',
                        color: form.prioridad === p
                          ? `${p === 'Urgente' ? '#DC2626' : p === 'Alta' ? '#D97706' : 'var(--primary)'}`
                          : 'var(--gray-600)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {p === 'Normal' ? '📋' : p === 'Alta' ? '⚠️' : '🔴'} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Requerimiento del Cliente</label>
                <textarea value={form.falla_reportada} onChange={(e) => updateChange('falla_reportada', e.target.value)} placeholder="Describa lo que el cliente necesita..." />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }}>
                Recibir Equipo y Generar Orden
              </button>
            </form>
          </div>

          {ordenCreada && (
            <div className="success-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Orden Creada Correctamente</h3>
                  <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>{ordenCreada.numero_ot}</p>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Código: {ordenCreada.codigo_corto}</p>
                  <span className="badge badge-info" style={{ marginTop: '6px' }}>Recibido</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-success" onClick={() => downloadQR(ordenCreada.id)}>
                    Descargar QR
                  </button>
                  <Link to={`/ordenes/${ordenCreada.id}`} className="btn btn-outline">
                    Ver Detalle
                  </Link>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  Subir Foto del Equipo
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, ordenCreada.id)} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
        </div>
        )}

        <div>
          <div className="card">
            <div className="card-header">Órdenes Recientes</div>
            <div className="quick-search">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Buscar por cliente, empresa o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="progress-list">
              {loading ? (
                <SkeletonTable rows={5} cols={4} />
              ) : ordenes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No hay órdenes registradas</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Equipo</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o) => (
                      <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ordenes/${o.id}`)}>
                        <td><strong style={{ color: 'var(--primary)' }}>{o.codigo_corto}</strong></td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{o.cliente?.nombre}</div>
                          {o.cliente?.empresa && <small style={{ color: 'var(--gray-400)' }}>{o.cliente.empresa}</small>}
                        </td>
                        <td><small>{o.tipo_servicio || 'Reparación'} - {o.equipo?.tipo_equipo} - {o.equipo?.marca}</small></td>
                        <td><span className={`badge ${ESTADOS_COLORES[o.estado]}`}>{o.estado}</span></td>
                        <td>
                          <Link to={`/ordenes/${o.id}`} className="btn btn-primary btn-sm">Ver</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
