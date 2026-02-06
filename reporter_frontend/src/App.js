// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import ReportsPage from './components/ReportsPage';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminConsole from './components/AdminConsole';

function App() {
  const { token } = useAuth();

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" /> : <Login />}
        />

        <Route path="/register" element={<Register />} />

        {/* Dashboard now shows the full ReportsPage with charts */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          }
        />

        {/* Keep the /sales/ar route for consistency */}
        <Route
          path="/sales/ar"
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
    </ThemeProvider>
  );
}

export default App;