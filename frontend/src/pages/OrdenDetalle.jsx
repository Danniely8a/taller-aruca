import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workOrders, photos, statusHistory, qr, payments } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PhotoGallery from '../components/PhotoGallery';
import ExportOrderButton from '../components/ExportOrder';
import { SkeletonCard } from '../components/Skeleton';

export default function OrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [orden, setOrden] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [foto, setFoto] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [totalPagado, setTotalPagado] = useState(0);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [pagoForm, setPagoForm] = useState({ monto: '', descripcion: '', comprobante: null });
  const [notasTecnicas, setNotasTecnicas] = useState('');
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  const ESTADOS_REPARACION = [
    'Recibido', 'En Diagnóstico', 'Esperando Presupuesto', 'Esperando Aprobación',
    'Esperando Repuestos', 'En Reparación', 'Listo para Entrega', 'Entregado',
    'Devolución por Garantía'
  ];

  const ESTADOS_REPARACION_TECNICO = ['Recibido', 'En Diagnóstico / Presupuesto', 'Listo para Entrega', 'Entregado'];

  const ESTADOS_AFILADO = [
    'Recibido', 'Afilando (En Proceso)', 'Listo para Entrega', 'Entregado'
  ];

  const esTecnico = user?.rol === 'Técnico' && user?.correo !== 'carlos@gmail.com';
  const ESTADOS = orden?.tipo_servicio === 'Afilado'
    ? ESTADOS_AFILADO
    : (esTecnico ? ESTADOS_REPARACION_TECNICO : ESTADOS_REPARACION);

  const ESTADOS_COLORES = {
    'Recibido': 'badge-info', 'En Diagnóstico': 'badge-warning',
    'En Diagnóstico / Presupuesto': 'badge-warning',
    'Esperando Presupuesto': 'badge-warning', 'Esperando Aprobación': 'badge-warning',
    'Esperando Repuestos': 'badge-danger', 'En Reparación': 'badge-info',
    'Listo para Entrega': 'badge-success', 'Entregado': 'badge-success',
    'Devolución por Garantía': 'badge-danger',
    'Afilando (En Proceso)': 'badge-warning', 'Pagado': 'badge-success',
  };

  useEffect(() => { loadOrden(); loadHistorial(); loadPagos(); }, [id]);

  const loadOrden = async () => {
    try {
      const res = await workOrders.getOne(id);
      setOrden(res.data);
      setNotasTecnicas(res.data.notas_tecnicas || '');
      try {
        const photoRes = await photos.get(id);
        setFoto(photoRes.data);
        setFotos(photoRes.data ? [photoRes.data] : []);
      } catch { setFoto(null); setFotos([]); }
    } catch (err) {
      toast.error('Error al cargar la orden');
      navigate('/ordenes');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadHistorial = async () => {
    try {
      const res = await statusHistory.getByOrder(id);
      setHistorial(res.data);
    } catch {}
  };

  const loadPagos = async () => {
    try {
      const res = await payments.getByOrder(id);
      setPagos(res.data.pagos);
      setTotalPagado(res.data.total_pagado);
    } catch {}
  };

  const handlePagoSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('monto', pagoForm.monto);
      formData.append('descripcion', pagoForm.descripcion);
      formData.append('usuario_id', user.id);
      if (pagoForm.comprobante) {
        formData.append('comprobante', pagoForm.comprobante);
      }
      await payments.create(id, formData);
      toast.success('Pago registrado');
      setShowPagoModal(false);
      setPagoForm({ monto: '', descripcion: '', comprobante: null });
      loadPagos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    }
  };

  const handleDeletePago = async (paymentId) => {
    if (!confirm('¿Eliminar este pago?')) return;
    try {
      await payments.delete(paymentId);
      toast.success('Pago eliminado');
      loadPagos();
    } catch {
      toast.error('Error al eliminar pago');
    }
  };

  const handleGuardarNotas = async () => {
    setGuardandoNotas(true);
    try {
      await workOrders.updateNotas(id, { notas_tecnicas: notasTecnicas });
      toast.success('Notas guardadas');
      loadOrden();
    } catch {
      toast.error('Error al guardar notas');
    } finally {
      setGuardandoNotas(false);
    }
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

  if (!orden) return (
    <div style={{ padding: '20px' }}>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} style={{ marginTop: '16px' }} />
    </div>
  );

  return (
    <div>
      <div className="top-bar with-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-outline" onClick={() => navigate(esTecnico ? '/mis-ordenes' : '/ordenes')}>← Volver</button>
          <h1 style={{ fontSize: '1.5rem' }}>Orden {orden.numero_ot}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('Gerente General', 'Supervisor', 'Técnico', 'Recepción / Ventas') && (
            <button className="btn btn-primary" onClick={() => setShowEstadoModal(true)}>
              Cambiar Estado
            </button>
          )}
          {hasPermission('Recepción / Ventas', 'Gerente General') && (
            <button className="btn btn-success" onClick={downloadQR}>
              Descargar Etiqueta QR
            </button>
          )}
          <ExportOrderButton orden={orden} historial={historial} />
          <button className="btn btn-outline" onClick={() => window.open(`/api/work-orders/${id}/comprobante`, '_blank')}>
            Comprobante Cliente
          </button>
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
                <p><strong style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Prioridad:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: orden.prioridad === 'Urgente' ? '#FEE2E2' : orden.prioridad === 'Alta' ? '#FEF3C7' : '#E0F2FE',
                    color: orden.prioridad === 'Urgente' ? '#DC2626' : orden.prioridad === 'Alta' ? '#D97706' : '#0369A1'
                  }}>
                    {orden.prioridad === 'Normal' ? '📋' : orden.prioridad === 'Alta' ? '⚠️' : '🔴'} {orden.prioridad}
                  </span>
                </p>
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
            {orden.cliente?.cedula_rif && <p><strong>Cédula/RIF:</strong> {orden.cliente.cedula_rif}</p>}
            <p><strong>Nombre:</strong> {orden.cliente?.nombre}</p>
            <p><strong>Teléfono:</strong> {orden.cliente?.telefono}</p>
            {orden.cliente?.empresa && <p><strong>Empresa:</strong> {orden.cliente.empresa}</p>}
            {orden.cliente?.correo && <p><strong>Correo:</strong> {orden.cliente.correo}</p>}
          </div>

          <div className="card">
            {orden.tipo_servicio === 'Afilado' ? (
              <>
                <div className="card-header">Servicio de Afilado</div>
                {orden.item_seleccionado && orden.item_seleccionado.length > 0 && (
                  <div>
                    <strong>Ítems:</strong>
                    <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                          <th style={{ textAlign: 'left', padding: '4px 0', fontSize: '0.82rem' }}>Ítem</th>
                          <th style={{ textAlign: 'center', padding: '4px 0', fontSize: '0.82rem', width: '60px' }}>Cant.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.item_seleccionado.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '4px 0', fontSize: '0.85rem' }}>{item.item || item}</td>
                            <td style={{ textAlign: 'center', padding: '4px 0', fontWeight: 700 }}>{item.cantidad || 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="card-header">Información del Equipo</div>
                <p><strong>Tipo:</strong> {orden.equipo?.tipo_equipo}</p>
                <p><strong>Marca:</strong> {orden.equipo?.marca}</p>
                <p><strong>Modelo:</strong> {orden.equipo?.modelo}</p>
                {orden.equipo?.numero_serie && <p><strong>N° Serie:</strong> {orden.equipo.numero_serie}</p>}
              </>
            )}
          </div>

          {orden.falla_reportada && (
            <div className="card">
              <div className="card-header">Requerimiento del Cliente</div>
              <p style={{ color: 'var(--gray-700)' }}>{orden.falla_reportada}</p>
            </div>
          )}

          <div className="card">
            <div className="card-header">Notas Técnicas / Presupuesto de Repuestos</div>
            {user?.rol === 'Técnico' ? (
              <>
                <textarea
                  value={notasTecnicas}
                  onChange={(e) => setNotasTecnicas(e.target.value)}
                  placeholder="Detallar repuestos necesarios, trabajo a realizar, presupuesto..."
                  style={{ width: '100%', minHeight: '120px', padding: '10px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleGuardarNotas} disabled={guardandoNotas}>
                    {guardandoNotas ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: notasTecnicas ? 'var(--gray-700)' : 'var(--gray-400)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{notasTecnicas || 'Sin notas técnicas'}</p>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-header">{orden?.tipo_servicio === 'Afilado' ? 'Fotografía del Afilado' : 'Fotografía del Equipo'}</div>
            {loadingPhotos ? (
              <SkeletonCard lines={2} />
            ) : (
              <PhotoGallery photos={fotos} />
            )}
            {hasPermission('Recepción / Ventas', 'Gerente General') && (
              <div style={{ marginTop: '12px' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  {orden?.tipo_servicio === 'Afilado' ? 'Subir Foto del Afilado' : 'Subir Foto del Equipo'}
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

          {user?.rol !== 'Técnico' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pagos</span>
              {hasPermission('Gerente General', 'Supervisor', 'Recepción / Ventas') && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowPagoModal(true)}>+ Pago</button>
              )}
            </div>
            {pagos.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', padding: '16px 0', textAlign: 'center' }}>Sin pagos registrados</p>
            ) : (
              <>
                {pagos.map((p) => (
                  <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--success)' }}>${p.monto.toFixed(2)}</strong>
                        {p.descripcion && <span style={{ color: 'var(--gray-500)', marginLeft: '8px' }}>{p.descripcion}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>{new Date(p.fecha_pago).toLocaleDateString()}</span>
                        {p.comprobante_ruta && (
                          <a href={p.comprobante_url || `/api/photos/uploads/${p.comprobante_ruta}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Ver</a>
                        )}
                        {hasPermission('Gerente General') && (
                          <button onClick={() => handleDeletePago(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)' }}>
                  <span>Total Pagado:</span>
                  <span style={{ color: 'var(--success)' }}>${totalPagado.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          )}
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

      {showPagoModal && (
        <div className="modal-overlay" onClick={() => setShowPagoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Registrar Pago</h2>
            <form onSubmit={handlePagoSubmit}>
              <div className="form-group">
                <label className="label-required">Monto ($)</label>
                <input type="number" step="0.01" min="0" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input value={pagoForm.descripcion} onChange={(e) => setPagoForm({ ...pagoForm, descripcion: e.target.value })} placeholder="Ej: Pago inicial, abono..." />
              </div>
              <div className="form-group">
                <label>Comprobante de Pago</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setPagoForm({ ...pagoForm, comprobante: e.target.files[0] })} />
                <small style={{ color: 'var(--gray-400)' }}>Formatos: PNG, JPG, PDF</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
