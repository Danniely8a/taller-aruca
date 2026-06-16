import { useState, useEffect } from 'react';
import { clients } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Clientes() {
  const { hasPermission } = useAuth();
  const [lista, setLista] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', telefono: '', empresa: '', correo: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await clients.getAll(); setLista(res.data); }
    catch (err) { toast.error('Error al cargar clientes'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await clients.update(editing.id, form); toast.success('Cliente actualizado'); }
      else { await clients.create(form); toast.success('Cliente creado'); }
      setShowModal(false); setForm({ nombre: '', telefono: '', empresa: '', correo: '' }); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  const handleEdit = (c) => { setEditing(c); setForm({ nombre: c.nombre, telefono: c.telefono, empresa: c.empresa || '', correo: c.correo || '' }); setShowModal(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await clients.delete(id); toast.success('Cliente eliminado'); load(); }
    catch (err) { toast.error('Error al eliminar'); }
  };

  return (
    <div>
      <div className="top-bar with-actions">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ nombre: '', telefono: '', empresa: '', correo: '' }); setShowModal(true); }}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Empresa</th><th>Correo</th><th>Registro</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td><td style={{ fontWeight: 500 }}>{c.nombre}</td><td>{c.telefono}</td><td>{c.empresa || '-'}</td><td>{c.correo || '-'}</td>
                <td>{new Date(c.fecha_registro).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(c)}>Editar</button>{' '}
                  {hasPermission('Gerente General') && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Eliminar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label-required">Nombre Completo</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label-required">Teléfono</label>
                  <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Empresa</label>
                  <input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Opcional" />
                </div>
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
