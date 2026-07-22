import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Component } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Recepcion from './pages/Recepcion';
import Usuarios from './pages/Usuarios';
import Clientes from './pages/Clientes';
import Equipos from './pages/Equipos';
import Ordenes from './pages/Ordenes';
import OrdenDetalle from './pages/OrdenDetalle';
import Escaner from './pages/Escaner';
import MisOrdenes from './pages/MisOrdenes';
import PagosPage from './pages/PagosPage';
import GenesisPage from './pages/GenesisPage';
import CambiarContrasena from './pages/CambiarContrasena';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#fff', color: '#000' }}>
          <h2 style={{ color: 'red' }}>Error en la aplicación:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ marginTop: '10px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  const esCarlos = user?.correo === 'carlos@gmail.com';
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={esCarlos ? <Navigate to="/mis-ordenes" /> : <Recepcion />} />
        <Route path="dashboard" element={esCarlos ? <Navigate to="/mis-ordenes" /> : <Dashboard />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="equipos" element={<Equipos />} />
        <Route path="ordenes" element={esCarlos ? <Navigate to="/mis-ordenes" /> : <Ordenes />} />
        <Route path="ordenes/:id" element={<OrdenDetalle />} />
        <Route path="mis-ordenes" element={<MisOrdenes />} />
        <Route path="escaner" element={esCarlos ? <Navigate to="/mis-ordenes" /> : <Escaner />} />
        <Route path="pagos" element={esCarlos ? <Navigate to="/mis-ordenes" /> : <PagosPage />} />
        <Route path="genesis" element={<GenesisPage />} />
        <Route path="cambiar-contrasena" element={<CambiarContrasena />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
