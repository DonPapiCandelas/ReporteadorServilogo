// src/components/Dashboard.js
import React from 'react';
import './Dashboard.css';
// ¡NUEVAS IMPORTACIONES!
import { Link, Outlet, useLocation } from 'react-router-dom'; 

function Dashboard({ user, onLogout }) {
  const location = useLocation(); // Hook para saber en qué página estamos

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-left">

          {/* ¡ENLACES ACTUALIZADOS! */}
          {/* Usamos 'isActive' para resaltar el enlace de la página actual */}
          <Link 
            to="/" 
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Reports Dashboard
          </Link>

          {user.is_admin && (
            <Link 
              to="/console" 
              className={`navbar-link ${location.pathname === '/console' ? 'active' : ''}`}
            >
              Admin Console
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span>Welcome, <strong>{user.username}</strong>!</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* ¡ESTA ES LA MAGIA!
          <Outlet/> es el "espacio vacío" donde React Router
          dibujará la página actual (ya sea ReportsPage o AdminConsole).
        */}
        <Outlet />
      </div>
    </div>
  );
}

export default Dashboard;