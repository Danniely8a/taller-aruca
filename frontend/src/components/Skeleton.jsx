import './Skeleton.css';

export function SkeletonLine({ width = '100%', height = '14px', style }) {
  return <div className="skeleton-line" style={{ width, height, ...style }} />;
}

export function SkeletonCircle({ size = '40px', style }) {
  return <div className="skeleton-circle" style={{ width: size, height: size, ...style }} />;
}

export function SkeletonCard({ lines = 4, style }) {
  return (
    <div className="skeleton-card" style={style}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={c === 0 ? '40px' : `${60 + Math.random() * 30}%`} height="12px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="skeleton-stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <SkeletonLine width="60%" height="12px" />
          <SkeletonLine width="40%" height="28px" style={{ marginTop: '8px' }} />
        </div>
      ))}
    </div>
  );
}
