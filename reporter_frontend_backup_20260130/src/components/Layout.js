// src/components/Layout.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children, title }) => {
  const { user, logout, companyKey, setCompanyKey, companies } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // Nuevo estado para móvil

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen); // Toggle para móvil

  return (
    <div className="dashboard-container">
      {/* Backdrop para móvil */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)}></div>}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-placeholder">📊</div>
            {!collapsed && <h2 className="brand-name">Financials PRO</h2>}
          </div>
          {/* Botón cerrar en móvil */}
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>×</button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            title="AR Aging Report"
            onClick={() => setMobileOpen(false)} // Cerrar al navegar
          >
            <span className="icon">📄</span>
            {!collapsed && <span className="label">AR Aging Report</span>}
          </Link>

          {user?.is_admin && (
            <Link
              to="/admin"
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              title="User Management"
              onClick={() => setMobileOpen(false)}
            >
              <span className="icon">⚙️</span>
              {!collapsed && <span className="label">User Management</span>}
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleSidebar} className="toggle-sidebar-btn desktop-only">
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
          {/* Botón Hamburguesa (Solo Móvil) */}
          <button className="hamburger-btn" onClick={toggleMobileSidebar}>
            ☰
          </button>

          <h1 className="page-title">{title}</h1>
          <div className="header-actions">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label className="company-label" style={{ fontSize: "0.9rem", opacity: 0.9 }}>Company:</label>
              <select
                value={companyKey || ""}
                onChange={(e) => setCompanyKey(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                className="company-select"
              >
                {(companies || []).map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
              <span className="date-display">{new Date().toLocaleDateString('en-US', { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
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
