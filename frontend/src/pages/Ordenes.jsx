import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workOrders, clients, equipments } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Ordenes() {
  const { user, hasPermission } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ cliente_id: '', equipo_id: '', prioridad: 'Normal', falla_reportada: '' });

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

  useEffect(() => { load(); loadClientes(); loadEquipos(); }, [filtroEstado]);

  const load = async () => {
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const res = await workOrders.getAll(params);
      let data = res.data;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        data = data.filter(o =>
          o.cliente?.nombre?.toLowerCase().includes(q) ||
          o.codigo_corto?.toLowerCase().includes(q) ||
          o.numero_ot?.toLowerCase().includes(q)
        );
      }
      setOrdenes(data);
    } catch (err) { toast.error('Error al cargar órdenes'); }
  };

  const loadClientes = async () => {
    try { const res = await clients.getAll(); setClientes(res.data); } catch {}
  };

  const loadEquipos = async () => {
    try { const res = await equipments.getAll(); setEquipos(res.data); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await workOrders.create({ ...form, usuario_recepcion: user.id });
      toast.success('Orden de trabajo creada');
      setShowModal(false);
      setForm({ cliente_id: '', equipo_id: '', prioridad: 'Normal', falla_reportada: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear orden');
    }
  };

  const filtered = ordenes.filter(o => {
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return o.cliente?.nombre?.toLowerCase().includes(q) || o.codigo_corto?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="top-bar with-actions">
        <h1>Órdenes de Trabajo</h1>
        {hasPermission('Recepción / Ventas', 'Gerente General') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nueva Orden
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', width: '100%' }}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: '250px' }}>
            <input
              placeholder="Buscar por cliente o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>OT</th>
              <th>Código</th>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td><strong style={{ color: 'var(--primary)' }}>{o.numero_ot}</strong></td>
                <td>{o.codigo_corto}</td>
                <td>{o.cliente?.nombre || '-'}</td>
                <td><small>{o.equipo?.tipo_equipo} - {o.equipo?.marca}</small></td>
                <td><span className={`badge ${ESTADOS_COLORES[o.estado]}`}>{o.estado}</span></td>
                <td>{o.prioridad}</td>
                <td>{new Date(o.fecha_ingreso).toLocaleDateString()}</td>
                <td>
                  <Link to={`/ordenes/${o.id}`} className="btn btn-primary btn-sm">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Orden de Trabajo</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label-required">Cliente</label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label-required">Equipo</label>
                <select value={form.equipo_id} onChange={(e) => setForm({ ...form, equipo_id: e.target.value })} required>
                  <option value="">Seleccionar equipo...</option>
                  {equipos.map((e) => <option key={e.id} value={e.id}>{e.tipo_equipo} - {e.marca} {e.modelo}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Prioridad</label>
                <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div className="form-group">
                <label>Falla Reportada</label>
                <textarea value={form.falla_reportada} onChange={(e) => setForm({ ...form, falla_reportada: e.target.value })} placeholder="Describa la falla del equipo..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
