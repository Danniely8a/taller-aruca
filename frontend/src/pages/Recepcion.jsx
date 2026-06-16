import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workOrders, photos, qr } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TIPOS_EQUIPO = ['Compresores', 'Pistolas para clavar', 'Engrapadoras', 'Máquinas pequeñas', 'Máquinas grandes'];

export default function Recepcion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenCreada, setOrdenCreada] = useState(null);
  const [form, setForm] = useState({
    nombre_cliente: '',
    telefono: '',
    empresa: '',
    correo: '',
    tipo_equipo: 'Compresores',
    marca: '',
    modelo: '',
    numero_serie: '',
    falla_reportada: '',
    prioridad: 'Normal',
  });

  const ESTADOS_COLORES = {
    'Recibido': 'badge-info', 'En Diagnóstico': 'badge-warning',
    'Esperando Presupuesto': 'badge-warning', 'Esperando Aprobación': 'badge-warning',
    'Esperando Repuestos': 'badge-danger', 'En Reparación': 'badge-info',
    'Listo para Entrega': 'badge-success', 'Entregado': 'badge-success',
  };

  useEffect(() => { cargarOrdenes(); }, [busqueda]);

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
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await workOrders.recepcion({
        ...form,
        usuario_recepcion: user.id,
      });
      toast.success('Orden creada correctamente');
      setOrdenCreada(res.data);
      setForm({
        nombre_cliente: '',
        telefono: '',
        empresa: '',
        correo: '',
        tipo_equipo: 'Compresores',
        marca: '',
        modelo: '',
        numero_serie: '',
        falla_reportada: '',
        prioridad: 'Normal',
      });
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
    <div>
      <div className="top-bar">
        <h1>Recepción de Equipos</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '28px' }}>
        <div>
          <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '24px' }}>
              Nuevo Ingreso
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-section-title">Datos del Cliente</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label-required">Nombre del Cliente</label>
                  <input value={form.nombre_cliente} onChange={(e) => updateChange('nombre_cliente', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label-required">Teléfono</label>
                  <input value={form.telefono} onChange={(e) => updateChange('telefono', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Empresa</label>
                  <input value={form.empresa} onChange={(e) => updateChange('empresa', e.target.value)} placeholder="Opcional" />
                </div>
                <div className="form-group">
                  <label>Correo</label>
                  <input type="email" value={form.correo} onChange={(e) => updateChange('correo', e.target.value)} placeholder="Opcional" />
                </div>
              </div>

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
                <div className="form-group">
                  <label className="label-required">Prioridad</label>
                  <select value={form.prioridad} onChange={(e) => updateChange('prioridad', e.target.value)}>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Falla Reportada</label>
                <textarea value={form.falla_reportada} onChange={(e) => updateChange('falla_reportada', e.target.value)} placeholder="Describe el problema del equipo..." />
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
              {ordenes.length === 0 ? (
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
                        <td><small>{o.equipo?.tipo_equipo} - {o.equipo?.marca}</small></td>
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
