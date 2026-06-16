import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workOrders, photos, statusHistory, qr } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [orden, setOrden] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [foto, setFoto] = useState(null);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');

  const ESTADOS = [
    'Recibido', 'En Diagnóstico', 'Esperando Presupuesto', 'Esperando Aprobación',
    'Esperando Repuestos', 'En Reparación', 'Listo para Entrega', 'Entregado'
  ];

  const ESTADOS_COLORES = {
    'Recibido': 'badge-info', 'En Diagnóstico': 'badge-warning',
    'Esperando Presupuesto': 'badge-warning', 'Esperando Aprobación': 'badge-warning',
    'Esperando Repuestos': 'badge-danger', 'En Reparación': 'badge-info',
    'Listo para Entrega': 'badge-success', 'Entregado': 'badge-success',
  };

  useEffect(() => { loadOrden(); loadHistorial(); }, [id]);

  const loadOrden = async () => {
    try {
      const res = await workOrders.getOne(id);
      setOrden(res.data);
      try {
        const photoRes = await photos.get(id);
        setFoto(photoRes.data);
      } catch { setFoto(null); }
    } catch (err) {
      toast.error('Error al cargar la orden');
      navigate('/ordenes');
    }
  };

  const loadHistorial = async () => {
    try {
      const res = await statusHistory.getByOrder(id);
      setHistorial(res.data);
    } catch {}
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await photos.upload(id, file);
      toast.success('Foto subida correctamente');
      loadOrden();
    } catch (err) {
      toast.error('Error al subir foto');
    }
  };

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    try {
      await workOrders.updateEstado(id, { nuevo_estado: nuevoEstado, usuario_id: user.id });
      toast.success('Estado actualizado');
      setShowEstadoModal(false);
      setNuevoEstado('');
      loadOrden();
      loadHistorial();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const downloadQR = async () => {
    try {
      await qr.download(id);
      toast.success('QR descargado correctamente');
    } catch {
      toast.error('Error al generar el QR');
    }
  };

  if (!orden) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>Cargando...</div>;

  return (
    <div>
      <div className="top-bar with-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/ordenes')}>← Volver</button>
          <h1 style={{ fontSize: '1.5rem' }}>Orden {orden.numero_ot}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('Gerente General', 'Supervisor') && (
            <button className="btn btn-primary" onClick={() => setShowEstadoModal(true)}>
              Cambiar Estado
            </button>
          )}
          {hasPermission('Recepción / Ventas', 'Gerente General') && (
            <button className="btn btn-success" onClick={downloadQR}>
              Descargar Etiqueta QR
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div>
          <div className="card">
            <div className="orden-header">
              <div className="orden-data">
                <p><strong style={{ color: 'var(--gray-500)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Código</strong></p>
                <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{orden.codigo_corto}</p>
                <p style={{ marginTop: '8px' }}>
                  <strong style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Estado:</strong>{' '}
                  <span className={`badge ${ESTADOS_COLORES[orden.estado]}`}>{orden.estado}</span>
                </p>
                <p><strong style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Prioridad:</strong> {orden.prioridad}</p>
              </div>
              <div className="orden-meta">
                <p><strong>Fecha Ingreso</strong></p>
                <p>{new Date(orden.fecha_ingreso).toLocaleString()}</p>
                <p style={{ marginTop: '8px' }}><strong>Recepcionista</strong></p>
                <p>{orden.recepcionista?.nombre}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Información del Cliente</div>
            <p><strong>Nombre:</strong> {orden.cliente?.nombre}</p>
            <p><strong>Teléfono:</strong> {orden.cliente?.telefono}</p>
            {orden.cliente?.empresa && <p><strong>Empresa:</strong> {orden.cliente.empresa}</p>}
            {orden.cliente?.correo && <p><strong>Correo:</strong> {orden.cliente.correo}</p>}
          </div>

          <div className="card">
            <div className="card-header">Información del Equipo</div>
            <p><strong>Tipo:</strong> {orden.equipo?.tipo_equipo}</p>
            <p><strong>Marca:</strong> {orden.equipo?.marca}</p>
            <p><strong>Modelo:</strong> {orden.equipo?.modelo}</p>
            {orden.equipo?.numero_serie && <p><strong>N° Serie:</strong> {orden.equipo.numero_serie}</p>}
          </div>

          {orden.falla_reportada && (
            <div className="card">
              <div className="card-header">Falla Reportada</div>
              <p style={{ color: 'var(--gray-700)' }}>{orden.falla_reportada}</p>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-header">Fotografía del Equipo</div>
            {foto ? (
              <img src={`/api/photos/uploads/${foto.ruta_foto}`} alt="Equipo" className="photo-preview" />
            ) : (
              <p style={{ color: 'var(--gray-400)', padding: '20px 0' }}>Sin fotografía</p>
            )}
            {hasPermission('Recepción / Ventas', 'Gerente General') && (
              <div style={{ marginTop: '12px' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  Subir Foto
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">Historial de Estados</div>
            {historial.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', padding: '16px 0', textAlign: 'center' }}>Sin cambios registrados</p>
            ) : (
              <div className="progress-list" style={{ maxHeight: '350px' }}>
                {historial.map((h) => (
                  <div key={h.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${ESTADOS_COLORES[h.nuevo_estado]}`}>
                        {h.nuevo_estado}
                      </span>
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>
                        {new Date(h.fecha_cambio).toLocaleString()}
                      </span>
                    </div>
                    {h.estado_anterior && (
                      <p style={{ color: 'var(--gray-500)', fontSize: '0.78rem', marginTop: '4px' }}>
                        Anterior: {h.estado_anterior}
                      </p>
                    )}
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>
                      Por: {h.usuario_nombre}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEstadoModal && (
        <div className="modal-overlay" onClick={() => setShowEstadoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Cambiar Estado</h2>
            <p style={{ marginBottom: '18px', color: 'var(--gray-500)' }}>
              Estado actual: <span className={`badge ${ESTADOS_COLORES[orden.estado]}`}>{orden.estado}</span>
            </p>
            <div className="form-group">
              <label className="label-required">Nuevo Estado</label>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                <option value="">Seleccionar estado...</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowEstadoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCambiarEstado} disabled={!nuevoEstado}>
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
