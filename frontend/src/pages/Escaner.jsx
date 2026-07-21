import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Escaner() {
  const navigate = useNavigate();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    return () => {
      detenerCamara();
    };
  }, []);

  const detenerCamara = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setEscaneando(false);
  }, []);

  const iniciarEscaneo = async () => {
    try {
      setError(null);
      setResultado(null);
      scannedRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setEscaneando(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const escanear = () => {
        if (!streamRef.current || scannedRef.current) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR
            ? window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
            : null;

          if (code && code.data) {
            scannedRef.current = true;
            detenerCamara();
            procesarCodigo(code.data);
            return;
          }
        }
        animRef.current = requestAnimationFrame(escanear);
      };

      animRef.current = requestAnimationFrame(escanear);
    } catch (err) {
      console.error('Camera error:', err);
      setEscaneando(false);
      if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Permití el acceso en la configuración del navegador.');
      } else {
        setError('No se pudo acceder a la cámara: ' + err.message);
      }
    }
  };

  const procesarCodigo = (codigo) => {
    toast.success(`Código leído: ${codigo.substring(0, 60)}`);

    if (codigo.includes('/ver/ot/')) {
      const match = codigo.match(/\/ver\/ot\/(\d+)/);
      if (match) { window.location.href = `/ver/ot/${match[1]}`; return; }
    }

    if (codigo.includes('/ot/')) {
      const match = codigo.match(/\/ot\/(\d+)/);
      if (match) { window.location.href = `/ver/ot/${match[1]}`; return; }
    }

    if (codigo.includes('/ordenes/')) {
      const match = codigo.match(/\/ordenes\/(\d+)/);
      if (match) { navigate(`/ordenes/${match[1]}`); return; }
    }

    if (codigo.includes('https://') || codigo.includes('http://')) {
      window.location.href = codigo;
      return;
    }

    const numMatch = codigo.match(/(\d+)/);
    if (numMatch) {
      setResultado({ tipo: 'posible', texto: codigo });
      return;
    }

    toast.error('Código QR no reconocido');
  };

  const irAOrden = () => {
    if (resultado?.texto) {
      const num = resultado.texto.match(/(\d+)/);
      if (num) navigate(`/ordenes/${num[1]}`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="top-bar">
        <h1>Escanear QR</h1>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--gray-500)', marginBottom: '20px' }}>
          Apunta la cámara al código QR de la etiqueta del equipo
        </p>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{
          width: '100%',
          maxWidth: '350px',
          margin: '0 auto 20px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#000',
          display: escaneando ? 'block' : 'none',
          position: 'relative',
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              display: 'block',
              borderRadius: '12px',
            }}
            playsInline
            muted
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            border: '3px solid rgba(255,255,255,0.7)',
            borderRadius: '16px',
            pointerEvents: 'none',
          }} />
        </div>

        {!escaneando && !resultado && (
          <button className="btn btn-primary btn-lg" onClick={iniciarEscaneo} style={{ width: '100%' }}>
            Iniciar Cámara
          </button>
        )}

        {escaneando && (
          <button className="btn btn-danger" onClick={detenerCamara} style={{ width: '100%' }}>
            Detener
          </button>
        )}

        {error && (
          <div style={{ marginTop: '10px', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '0.9em' }}>
            {error}
          </div>
        )}

        {resultado && (
          <div style={{ marginTop: '12px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ marginBottom: '8px', color: '#166534' }}>Código Detectado</h3>
            <p style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '10px', borderRadius: '6px', wordBreak: 'break-all' }}>
              {resultado.texto}
            </p>
            <button className="btn btn-primary btn-lg" onClick={irAOrden} style={{ width: '100%', marginTop: '12px' }}>
              Ver Orden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
