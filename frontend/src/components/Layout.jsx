import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InstallButton from './InstallButton';
import NotificationBell from './NotificationBell';

const ALL_MENU_ITEMS = [
  { path: '/', label: 'Recepción', icon: '📥', roles: ['Gerente General', 'Supervisor', 'Recepción / Ventas'] },
  { path: '/dashboard', label: 'Inicio', icon: '📊', roles: ['Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico'] },
  { path: '/escaner', label: 'Escanear', icon: '📷', roles: ['Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico'] },
  { path: '/ordenes', label: 'Órdenes', icon: '📋', roles: ['Gerente General', 'Supervisor', 'Recepción / Ventas', 'Técnico'] },
  { path: '/mis-ordenes', label: 'Mis Órdenes', icon: '⚙️', roles: ['Técnico'] },
];

const MENU_OCULTO_CARLOS = ['/', '/dashboard', '/escaner', '/ordenes'];
const MENU_OCULTO_EDUARDO = ['/ordenes'];

const MENU_GENESIS = ['/genesis', '/pagos'];

const EXTRAS_MENU = {
  'Gerente General': [
    { path: '/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/clientes', label: 'Clientes', icon: '👤' },
    { path: '/equipos', label: 'Equipos', icon: '🔧' },
    { path: '/pagos', label: 'Pagos', icon: '💰' },
  ],
  'Supervisor': [
    { path: '/pagos', label: 'Pagos', icon: '💰' },
  ],
  'Técnico': [
    { path: '/pagos', label: 'Pagos', icon: '💰' },
  ],
  'Recepción / Ventas': [
    { path: '/clientes', label: 'Clientes', icon: '👤' },
    { path: '/equipos', label: 'Equipos', icon: '🔧' },
  ],
  'Pagos': [
    { path: '/genesis', label: 'Órdenes e Ítems', icon: '📋' },
    { path: '/pagos', label: 'Pagos', icon: '💰' },
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
          {[...ALL_MENU_ITEMS, ...extraItems]
            .filter(item => !item.roles || item.roles.includes(user?.rol))
            .filter(item => !(user?.correo === 'carlos@gmail.com' && MENU_OCULTO_CARLOS.includes(item.path)))
            .filter(item => !(user?.correo !== 'carlos@gmail.com' && user?.rol === 'Técnico' && MENU_OCULTO_EDUARDO.includes(item.path)))
            .filter(item => !(user?.correo !== 'carlos@gmail.com' && user?.rol === 'Técnico' && item.path === '/pagos'))
            .filter(item => !(user?.rol === 'Pagos' && !MENU_GENESIS.includes(item.path)))
            .map((item) => (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <div className="sidebar-user" style={{ flex: 1 }}>
              <div className="sidebar-avatar">{getInitials(user?.nombre)}</div>
              <div className="sidebar-user-info">
                <div className="name">{user?.nombre}</div>
                <div className="role">{user?.rol}</div>
              </div>
            </div>
            <NotificationBell />
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
        {ALL_MENU_ITEMS
          .filter(item => !item.roles || item.roles.includes(user?.rol))
          .filter(item => !(user?.correo === 'carlos@gmail.com' && MENU_OCULTO_CARLOS.includes(item.path)))
          .filter(item => !(user?.correo !== 'carlos@gmail.com' && user?.rol === 'Técnico' && MENU_OCULTO_EDUARDO.includes(item.path)))
          .map((item) => (
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
