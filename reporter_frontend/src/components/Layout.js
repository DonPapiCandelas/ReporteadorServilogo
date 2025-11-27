// src/components/Layout.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-placeholder">📊</div>
            {!collapsed && <h2 className="brand-name">Financials PRO</h2>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            title="AR Aging Report"
          >
            <span className="icon">📄</span>
            {!collapsed && <span className="label">AR Aging Report</span>}
          </Link>

          {user?.is_admin && (
            <Link
              to="/admin"
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              title="User Management"
            >
              <span className="icon">⚙️</span>
              {!collapsed && <span className="label">User Management</span>}
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleSidebar} className="toggle-sidebar-btn">
            <span className="icon">{collapsed ? '➜' : '⬅'}</span>
            {!collapsed && <span className="label">Collapse Menu</span>}
          </button>

          <div className="footer-divider"></div>

          {!collapsed && (
            <div className="user-info">
              <p className="user-name">{user?.username || 'User'}</p>
              <p className="user-role">{user?.is_admin ? 'Administrator' : 'Consultant'}</p>
            </div>
          )}

          <button onClick={logout} className="logout-button" title="Sign Out">
            <span className="icon">⏻</span>
            {!collapsed && <span className="label">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1 className="page-title">{title}</h1>
          <div className="header-actions">
            <span className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;