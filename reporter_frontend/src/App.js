// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Importamos Navigate
import { useAuth } from './context/AuthContext'; // Importamos useAuth
import Login from './components/Login';
import ReportsPage from './components/ReportsPage';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminConsole from './components/AdminConsole';

function App() {
  const { token } = useAuth(); // Leemos si hay token

  return (
    <Routes>
      {/* Si ya hay token, no mostramos Login, mandamos al Home ("/") */}
      <Route
        path="/login"
        element={token ? <Navigate to="/" /> : <Login />}
      />

      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <ReportsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminConsole />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;