import { useState, useEffect } from 'react';
import { users, auth } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PREGUNTAS = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad naciste?',
  '¿Cuál es tu color favorito?',
  '¿Cuál es tu comida favorita?',
  '¿Cómo se llama tu mejor amigo de la infancia?',
  '¿Cuál es tu equipo de fútbol favorito?',
];

export default function Usuarios() {
  const { hasPermission } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetUserNombre, setResetUserNombre] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '', correo: '', telefono: '', contrasena: '',
    pregunta_seguridad: '', respuesta_seguridad: '',
    rol: 'Recepción / Ventas', activo: true
  });

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
      setForm({ nombre: '', correo: '', telefono: '', contrasena: '', pregunta_seguridad: '', respuesta_seguridad: '', rol: 'Recepción / Ventas', activo: true });
      setEditing(null);
      loadUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({
      nombre: u.nombre, correo: u.correo, telefono: u.telefono || '',
      contrasena: '', pregunta_seguridad: u.pregunta_seguridad || '',
      respuesta_seguridad: '', rol: u.rol, activo: u.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try { await users.delete(id); toast.success('Usuario desactivado'); loadUsuarios(); }
    catch (err) { toast.error('Error al desactivar'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    try {
      await auth.resetPasswordAdmin({ user_id: resetUserId, nueva_contrasena: resetPassword });
      toast.success(`Contraseña de ${resetUserNombre} actualizada`);
      setShowResetModal(false);
      setResetPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al resetear contraseña');
    }
  };

  const openResetModal = (u) => {
    setResetUserId(u.id);
    setResetUserNombre(u.nombre);
    setResetPassword('');
    setShowResetModal(true);
  };

  if (!hasPermission('Gerente General')) {
    return <div className="card"><p>No tienes permiso para ver esta sección.</p></div>;
  }

  return (
    <div>
      <div className="top-bar with-actions">
        <h1>Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditing(null);
          setForm({ nombre: '', correo: '', telefono: '', contrasena: '', pregunta_seguridad: '', respuesta_seguridad: '', rol: 'Recepción / Ventas', activo: true });
          setShowModal(true);
        }}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Preg. Seg.</th><th>Activo</th><th></th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>{u.telefono || '-'}</td>
                <td><span className="badge badge-primary">{u.rol}</span></td>
                <td>{u.pregunta_seguridad ? '✅' : '❌'}</td>
                <td>{u.activo ? 'Si' : 'No'}</td>
                <td style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(u)}>Editar</button>
                  <button className="btn btn-outline btn-sm" onClick={() => openResetModal(u)} title="Resetear contraseña">🔑</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
                <label>Teléfono</label>
                <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+58 412 1234567" />
              </div>
              <div className="form-group">
                <label>{editing ? 'Nueva Contraseña' : 'Contraseña'}</label>
                <input type="password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} {...(!editing && { required: true })} placeholder={editing ? 'Dejar vacío para no cambiar' : ''} />
              </div>

              <div style={{ borderTop: '2px solid var(--gray-200)', margin: '16px 0', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔐 Pregunta de Seguridad (para recuperar contraseña)
                </div>
                <div className="form-group">
                  <label>Pregunta</label>
                  <select value={form.pregunta_seguridad} onChange={(e) => setForm({ ...form, pregunta_seguridad: e.target.value })}>
                    <option value="">Seleccionar pregunta...</option>
                    {PREGUNTAS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Respuesta</label>
                  <input
                    value={form.respuesta_seguridad}
                    onChange={(e) => setForm({ ...form, respuesta_seguridad: e.target.value })}
                    placeholder={editing ? 'Dejar vacío para no cambiar' : 'Tu respuesta'}
                    {...(!editing && form.pregunta_seguridad && { required: true })}
                  />
                  <small style={{ color: 'var(--gray-400)' }}>Se guarda de forma segura (encriptada)</small>
                </div>
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

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔑 Resetear Contraseña</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '16px' }}>
              Nueva contraseña para <strong>{resetUserNombre}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="label-required">Nueva Contraseña</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                  minLength={4}
                  placeholder="Mínimo 4 caracteres"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowResetModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Actualizar Contraseña</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
