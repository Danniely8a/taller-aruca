import { useState } from 'react';

export default function PhotoGallery({ photos = [], onDelete, canDelete = false }) {
  const [selected, setSelected] = useState(null);

  if (!photos.length) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📷</div>
        <p style={{ fontSize: '0.85rem' }}>Sin fotos</p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '8px',
      }}>
        {photos.map((p, i) => (
          <div
            key={p.id || i}
            onClick={() => setSelected(p)}
            style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              aspectRatio: '1',
              border: '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <img
              src={`/api/photos/uploads/${p.ruta_foto || p}`}
              alt={`Foto ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {canDelete && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(220,38,38,0.9)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >✕</button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            padding: '20px',
          }}
        >
          <img
            src={`/api/photos/uploads/${selected.ruta_foto || selected}`}
            alt="Vista ampliada"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          />
          <button
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >✕</button>
        </div>
      )}
    </>
  );
}
