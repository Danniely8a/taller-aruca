import { useState } from 'react';
import { auth } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CambiarContrasena() {
  const { user } = useAuth();
  const [form, setForm] = useState({ contrasena_actual: '', nueva_contrasena: '', confirmar: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.nueva_contrasena !== form.confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await auth.changePassword({
        contrasena_actual: form.contrasena_actual,
        nueva_contrasena: form.nueva_contrasena,
      });
      toast.success('Contraseña actualizada correctamente');
      setForm({ contrasena_actual: '', nueva_contrasena: '', confirmar: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="top-bar">
        <h1>Cambiar Contraseña</h1>
      </div>

      <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--primary-bg)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '1.8rem'
          }}>🔐</div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Hola <strong>{user?.nombre}</strong>, ingresa tu contraseña actual y la nueva contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label-required">Contraseña Actual</label>
            <input
              type="password"
              value={form.contrasena_actual}
              onChange={(e) => setForm({ ...form, contrasena_actual: e.target.value })}
              required
              placeholder="Tu contraseña actual"
            />
          </div>
          <div className="form-group">
            <label className="label-required">Nueva Contraseña</label>
            <input
              type="password"
              value={form.nueva_contrasena}
              onChange={(e) => setForm({ ...form, nueva_contrasena: e.target.value })}
              required
              minLength={4}
              placeholder="Mínimo 4 caracteres"
            />
          </div>
          <div className="form-group">
            <label className="label-required">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
              required
              minLength={4}
              placeholder="Repite la nueva contraseña"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
