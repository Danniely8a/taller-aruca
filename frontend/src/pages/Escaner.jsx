import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

export default function Escaner() {
  const navigate = useNavigate();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  const iniciarEscaneo = async () => {
    try {
      setResultado(null);
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 5,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          scanner.stop().catch(() => {});
          scanner.clear();
          scannerRef.current = null;
          setEscaneando(false);
          procesarCodigo(decodedText);
        },
        () => {}
      );
      setEscaneando(true);
    } catch (err) {
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
      console.error(err);
    }
  };

  const detenerEscaneo = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setEscaneando(false);
  };

  const procesarCodigo = (codigo) => {
    try {
      if (codigo.includes('OT:')) {
        const partes = {};
        codigo.split('|').forEach(p => {
          const [key, val] = p.split(':');
          partes[key] = val;
        });
        if (partes.ID) {
          setResultado({ tipo: 'orden', id: partes.ID, ot: partes.OT, codigo: partes.COD });
          toast.success(`Orden encontrada: ${partes.OT}`);
          return;
        }
      }

      const numMatch = codigo.match(/(\d+)/);
      if (numMatch) {
        setResultado({ tipo: 'posible', texto: codigo });
        return;
      }

      toast.error('Código QR no reconocido');
    } catch {
      toast.error('Error al procesar el código');
    }
  };

  const irAOrden = () => {
    if (resultado?.id) {
      navigate(`/ordenes/${resultado.id}`);
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

        <div
          id="qr-reader"
          ref={containerRef}
          style={{
            width: '100%',
            maxWidth: '350px',
            margin: '0 auto 20px',
            borderRadius: '12px',
            overflow: 'hidden',
            display: escaneando ? 'block' : 'none',
          }}
        />

        {!escaneando && !resultado && (
          <button className="btn btn-primary btn-lg" onClick={iniciarEscaneo} style={{ width: '100%' }}>
            Iniciar Cámara
          </button>
        )}

        {escaneando && (
          <button className="btn btn-danger" onClick={detenerEscaneo} style={{ width: '100%' }}>
            Detener
          </button>
        )}

        {resultado && (
          <div className="success-card" style={{ marginTop: '10px' }}>
            <h3>Código Detectado</h3>
            {resultado.tipo === 'orden' && (
              <>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{resultado.ot}</p>
                <p style={{ color: 'var(--gray-500)' }}>Código: {resultado.codigo}</p>
                <button className="btn btn-primary btn-lg" onClick={irAOrden} style={{ width: '100%', marginTop: '12px' }}>
                  Ver Orden Completa
                </button>
              </>
            )}
            {resultado.tipo === 'posible' && (
              <>
                <p style={{ color: 'var(--gray-600)', marginBottom: '10px' }}>Código detectado:</p>
                <p style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '10px', borderRadius: '6px', wordBreak: 'break-all' }}>{resultado.texto}</p>
                <button className="btn btn-outline" onClick={() => setResultado(null)} style={{ marginTop: '10px' }}>
                  Escanear de nuevo
                </button>
              </>
            )}
          </div>
        )}

        {!escaneando && resultado && (
          <button className="btn btn-outline" onClick={() => { setResultado(null); iniciarEscaneo(); }} style={{ width: '100%', marginTop: '12px' }}>
            Escanear otro código
          </button>
        )}
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
          Si no puedes escanear, busca la orden por código en la sección de Órdenes
        </p>
      </div>
    </div>
  );
}
