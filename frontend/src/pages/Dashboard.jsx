import { useState, useEffect } from 'react';
import { workOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import { SkeletonStats, SkeletonCard } from '../components/Skeleton';
import { BarChart, DoughnutChart, ChartLegend } from '../components/Charts';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullIndicator from '../components/PullIndicator';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, porEstado: {} });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await workOrders.getAll();
      const orders = res.data;
      const porEstado = {};
      orders.forEach((o) => {
        porEstado[o.estado] = (porEstado[o.estado] || 0) + 1;
      });
      setStats({ total: orders.length, porEstado });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const { containerRef, refreshing, pullDistance } = usePullToRefresh(fetchData);

  const chartData = Object.entries(stats.porEstado).map(([label, value]) => ({ label, value }));

  const ESTADOS_COLORES = {
    'Recibido': 'badge-info',
    'En Diagnóstico': 'badge-warning',
    'En Diagnóstico / Presupuesto': 'badge-warning',
    'Esperando Presupuesto': 'badge-warning',
    'Esperando Aprobación': 'badge-warning',
    'Esperando Repuestos': 'badge-danger',
    'En Reparación': 'badge-info',
    'Listo para Entrega': 'badge-success',
    'Entregado': 'badge-success',
    'Devolución por Garantía': 'badge-danger',
  };

  return (
    <div ref={containerRef}>
      <PullIndicator refreshing={refreshing} pullDistance={pullDistance} />
      <div className="top-bar">
        <h1>Bienvenido, {user?.nombre}</h1>
      </div>

      {loading ? (
        <>
          <SkeletonStats count={4} />
          <SkeletonCard lines={6} style={{ marginTop: '20px' }} />
        </>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
              <h3>Total Órdenes</h3>
              <div className="stat-value">{stats.total}</div>
            </div>
            {Object.entries(stats.porEstado).map(([estado, count]) => (
              <div className="stat-card" key={estado} style={{ borderLeftColor: 'var(--primary)' }}>
                <h3>{estado}</h3>
                <span className={`badge ${ESTADOS_COLORES[estado] || 'badge-info'}`} style={{ fontSize: '0.85rem', padding: '5px 12px' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
              <div className="card">
                <div className="card-header">Órdenes por Estado</div>
                <BarChart data={chartData} height={200} />
              </div>
              <div className="card">
                <div className="card-header">Distribución</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <DoughnutChart data={chartData} />
                  <ChartLegend data={chartData} />
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">Resumen por Estado</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(stats.porEstado).map(([estado, count]) => (
                <div key={estado} style={{ padding: '12px 18px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)' }}>
                  <span className={`badge ${ESTADOS_COLORES[estado] || 'badge-info'}`} style={{ marginRight: '8px' }}>{estado}</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
