const COLORS = ['#003A8C', '#059669', '#F59E0B', '#DC2626', '#7C3AED', '#06B6D4', '#EC4899', '#84CC16'];

export function BarChart({ data, height = 200 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS[i % COLORS.length] }}>{d.value}</span>
          <div style={{
            width: '100%',
            maxWidth: '48px',
            height: `${(d.value / max) * (height - 40)}px`,
            background: `linear-gradient(180deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)`,
            borderRadius: '6px 6px 2px 2px',
            transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)',
            minHeight: '4px',
          }} />
          <span style={{ fontSize: '0.6rem', color: '#6B7280', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
            {d.label.length > 10 ? d.label.slice(0, 10) + '…' : d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DoughnutChart({ data, size = 160, thickness = 24 }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashArray = `${pct * circumference} ${circumference}`;
          const dashOffset = -accumulated * circumference;
          accumulated += pct;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={thickness}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F2937' }}>{total}</span>
        <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>Total</span>
      </div>
    </div>
  );
}

export function ChartLegend({ data }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#4B5563' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
          <span>{d.label} ({d.value})</span>
        </div>
      ))}
    </div>
  );
}
