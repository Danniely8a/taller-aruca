import { useState, useEffect } from 'react';
import { users } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Usuarios() {
  const { hasPermission } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', contrasena: '', rol: 'Recepción / Ventas', activo: true });

  const ROLES = ['Gerente General', 'Supervisor', 'Técnico', 'Recepción / Ventas'];

  useEffect(() => { loadUsuarios(); }, []);

  const loadUsuarios = async () => {
    try { const res = await users.getAll(); setUsuarios(res.data); }
    catch (err) { toast.error('Error al cargar usuarios'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await users.update(editing.id, form); toast.success('Usuario actualizado'); }
      else { await users.create(form); toast.success('Usuario creado'); }
      setShowModal(false);
      setForm({ nombre: '', correo: '', telefono: '', contrasena: '', rol: 'Recepción / Ventas', activo: true });
      setEditing(null);
      loadUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ nombre: u.nombre, correo: u.correo, telefono: u.telefono || '', contrasena: '', rol: u.rol, activo: u.activo });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try { await users.delete(id); toast.success('Usuario desactivado'); loadUsuarios(); }
    catch (err) { toast.error('Error al desactivar'); }
  };

  if (!hasPermission('Gerente General')) {
    return <div className="card"><p>No tienes permiso para ver esta sección.</p></div>;
  }

  return (
    <div>
      <div className="top-bar with-actions">
        <h1>Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ nombre: '', correo: '', contrasena: '', rol: 'Recepción / Ventas', activo: true }); setShowModal(true); }}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Activo</th><th></th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                <td>{u.correo}</td>
                <td><span className="badge badge-primary">{u.rol}</span></td>
                <td>{u.activo ? 'Si' : 'No'}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(u)}>Editar</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label-required">Nombre</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label-required">Correo</label>
                <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Teléfono (WhatsApp)</label>
                <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+58 412 1234567" />
                <small style={{ color: 'var(--gray-400)' }}>Para recuperación de contraseña por WhatsApp</small>
              </div>
              <div className="form-group">
                <label>{editing ? 'Nueva Contraseña' : 'Contraseña'}</label>
                <input type="password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} {...(!editing && { required: true })} placeholder={editing ? 'Dejar vacío para no cambiar' : ''} />
              </div>
              <div className="form-group">
                <label className="label-required">Rol</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  Activo
                </label>
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
