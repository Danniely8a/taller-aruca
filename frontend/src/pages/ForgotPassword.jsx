import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [correo, setCorreo] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckCorreo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auth.checkPregunta({ correo });
      setPregunta(res.data.pregunta);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al buscar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await auth.recoverPassword({
        correo,
        respuesta,
        nueva_contrasena: nuevaContrasena,
      });
      toast.success('Contraseña restablecida correctamente');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px 32px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo_aruca.png" alt="Aruca" style={{ width: '80px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1F2937', marginBottom: '6px' }}>
            Recuperar Contraseña
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
            {step === 1 && 'Ingresa tu correo registrado'}
            {step === 2 && 'Responde tu pregunta de seguridad'}
            {step === 3 && '¡Listo! Ya puedes iniciar sesión'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleCheckCorreo}>
            <div className="form-group">
              <label className="label-required">Correo Electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@aruca.com"
                required
                style={{ fontSize: '1rem', padding: '14px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar mi cuenta'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRecover}>
            <div style={{
              background: 'var(--primary-bg)', borderRadius: '12px', padding: '16px',
              marginBottom: '20px', border: '1px solid var(--primary)'
            }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '6px', fontWeight: 600 }}>
                Tu pregunta de seguridad:
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
                🔐 {pregunta}
              </p>
            </div>
            <div className="form-group">
              <label className="label-required">Tu Respuesta</label>
              <input
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe tu respuesta"
                required
                style={{ fontSize: '1rem', padding: '14px' }}
              />
            </div>
            <div className="form-group">
              <label className="label-required">Nueva Contraseña</label>
              <input
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                required
                minLength={4}
                style={{ fontSize: '1rem', padding: '14px' }}
              />
            </div>
            <div className="form-group">
              <label className="label-required">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                required
                minLength={4}
                style={{ fontSize: '1rem', padding: '14px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={{
              width: '100%', marginTop: '10px', background: 'none', border: 'none',
              color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
            }}>
              ← Volver
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#D1FAE5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem'
            }}>✅</div>
            <p style={{ color: '#374151', marginBottom: '20px', fontWeight: 500 }}>
              Tu contraseña ha sido actualizada correctamente.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', textDecoration: 'none' }}>
              Iniciar Sesión
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: 'var(--gray-500)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
