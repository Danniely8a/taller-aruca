import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState(null);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auth.forgotPassword({ telefono });
      toast.success('Código enviado por WhatsApp');
      setDebugCode(res.data.debug_code);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await auth.verifyResetCode({
        telefono,
        codigo,
        nueva_contrasena: nuevaContrasena,
      });
      toast.success('Contraseña restablecida correctamente');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al verificar código');
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
            {step === 1 && 'Ingresa tu número de teléfono registrado'}
            {step === 2 && 'Ingresa el código que recibiste por WhatsApp'}
            {step === 3 && '¡Listo! Ya puedes iniciar sesión'}
          </p>
        </div>

        {debugCode && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px',
            padding: '10px 14px', marginBottom: '16px', fontSize: '0.8rem', color: '#92400E'
          }}>
            <strong>DEV:</strong> Tu código es <strong>{debugCode}</strong>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label className="label-required">Teléfono (WhatsApp)</label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+58 412 1234567"
                required
                style={{ fontSize: '1rem', padding: '14px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código por WhatsApp'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="label-required">Código de Verificación</label>
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="000000"
                required
                maxLength={6}
                style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '8px', fontWeight: 700, padding: '14px' }}
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
              {loading ? 'Verificando...' : 'Restablecer Contraseña'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={{
              width: '100%', marginTop: '10px', background: 'none', border: 'none',
              color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
            }}>
              ← Volver a enviar código
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
