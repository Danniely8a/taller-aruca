import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Recepcion from './pages/Recepcion';
import Usuarios from './pages/Usuarios';
import Clientes from './pages/Clientes';
import Equipos from './pages/Equipos';
import Ordenes from './pages/Ordenes';
import OrdenDetalle from './pages/OrdenDetalle';
import Escaner from './pages/Escaner';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Recepcion />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="equipos" element={<Equipos />} />
        <Route path="ordenes" element={<Ordenes />} />
        <Route path="ordenes/:id" element={<OrdenDetalle />} />
        <Route path="escaner" element={<Escaner />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
