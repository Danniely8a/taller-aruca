import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '../api';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const load = async () => {
    try {
      const res = await notifications.getAll();
      setNotifs(res.data.notifications);
      setNoLeidas(res.data.no_leidas);
    } catch {
      // Silently fail for polling - don't spam toasts
    }
  };

  const handleMarkAll = async () => {
    try {
      await notifications.markAllRead();
      setNoLeidas(0);
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
      toast.success('Notificaciones marcadas como leídas');
    } catch {
      toast.error('Error al marcar notificaciones');
    }
  };

  const handleClick = async (notif) => {
    if (!notif.leida) {
      try {
        await notifications.markRead(notif.id);
        setNoLeidas(prev => Math.max(0, prev - 1));
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n));
      } catch {
        toast.error('Error al marcar notificación');
      }
    }
    setOpen(false);
    if (notif.orden_trabajo_id) {
      navigate(`/ordenes/${notif.orden_trabajo_id}`);
    }
  };

  const TIPO_ICON = {
    'orden_creada': '📋',
    'reparacion_finalizada': '✅',
    'actualizacion_orden': '🔧',
    'default': '🔔'
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          position: 'relative',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🔔
        {noLeidas > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#DC2626',
            color: 'white',
            borderRadius: '50%',
            fontSize: '0.65rem',
            fontWeight: 700,
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          border: '1px solid var(--gray-200)',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem' }}>Notificaciones</strong>
            {noLeidas > 0 && (
              <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                Marcar todo como leído
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.85rem' }}>
              Sin notificaciones
            </div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--gray-100)',
                  cursor: 'pointer',
                  background: n.leida ? 'white' : 'var(--primary-bg)',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>{TIPO_ICON[n.tipo] || TIPO_ICON.default}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.leida ? 400 : 600, fontSize: '0.85rem' }}>{n.titulo}</div>
                    <div style={{ color: 'var(--gray-500)', fontSize: '0.78rem', marginTop: '2px' }}>{n.mensaje}</div>
                    <div style={{ color: 'var(--gray-400)', fontSize: '0.7rem', marginTop: '4px' }}>
                      {new Date(n.fecha_creacion).toLocaleString()}
                    </div>
                  </div>
                  {!n.leida && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
