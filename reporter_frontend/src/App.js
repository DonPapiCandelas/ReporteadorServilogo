// src/App.js
import React from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; // ¡La Plantilla!
import AdminConsole from './components/AdminConsole'; // ¡La Página de Admin!
import ReportsPage from './components/ReportsPage'; // <-- ¡LA IMPORTACIÓN CORREGIDA!

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* --- RUTAS PÚBLICAS --- */}
      <Route 
        path="/login" 
        element={token ? <Navigate to="/" /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={token ? <Navigate to="/" /> : <Register />}
      />
      
      {/* --- RUTAS PRIVADAS (requieren login) --- */}
      <Route 
        path="/*"
        element={
          token ? <MainApp /> : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

function MainApp() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div>Loading session...</div>;
  }

  return (
    <div className="App">
      {/* La Plantilla/Layout (Dashboard) ahora se renderiza aquí,
        y las rutas hijas se renderizarán DENTRO de su <Outlet/>
      */}
      <Routes>
        <Route path="/" element={<Dashboard user={user} onLogout={logout} />}>
          
          {/* Ruta hija por defecto (se renderiza en /) */}
          <Route index element={<ReportsPage />} />
          
          {/* Ruta hija de admin (se renderiza en /console) */}
          <Route 
            path="console" 
            element={
              user.is_admin ? <AdminConsole /> : <Navigate to="/" />
            } 
          />
          
        </Route>
      </Routes>
    </div>
  );
}

export default App;