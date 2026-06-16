import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InstallButton from './InstallButton';

const ALL_MENU_ITEMS = [
  { path: '/', label: 'Recepción', icon: '📥' },
  { path: '/dashboard', label: 'Inicio', icon: '📊' },
  { path: '/escaner', label: 'Escanear', icon: '📷' },
  { path: '/ordenes', label: 'Órdenes', icon: '📋' },
];

const EXTRAS_MENU = {
  'Gerente General': [
    { path: '/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/clientes', label: 'Clientes', icon: '👤' },
    { path: '/equipos', label: 'Equipos', icon: '🔧' },
  ],
  'Supervisor': [],
  'Técnico': [],
  'Recepción / Ventas': [
    { path: '/clientes', label: 'Clientes', icon: '👤' },
    { path: '/equipos', label: 'Equipos', icon: '🔧' },
  ],
};

export default function Layout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const extraItems = EXTRAS_MENU[user?.rol] || [];

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo_aruca.png" alt="ARUCA" className="sidebar-logo" />
          <h2>Sistema de Recepción</h2>
        </div>
        <nav>
          {[...ALL_MENU_ITEMS, ...extraItems].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <InstallButton />
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user?.nombre)}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.nombre}</div>
              <div className="role">{user?.rol}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="mobile-bottom-nav">
        {ALL_MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
        <button className="mobile-nav-item mobile-nav-more" onClick={() => setSidebarOpen(true)}>
          <span className="mobile-nav-icon">☰</span>
          <span className="mobile-nav-label">Más</span>
        </button>
      </nav>
    </div>
  );
}
