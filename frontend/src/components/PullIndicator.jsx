export default function PullIndicator({ refreshing, pullDistance, threshold = 80 }) {
  if (pullDistance <= 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: `${Math.min(pullDistance, threshold + 10)}px`,
      zIndex: 9999,
      pointerEvents: 'none',
      transition: refreshing ? 'none' : 'height 0.2s ease',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(0, 58, 140, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        transform: refreshing ? 'none' : `rotate(${rotation}deg)`,
        transition: refreshing ? 'none' : 'transform 0.1s ease',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{
          animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
        }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
