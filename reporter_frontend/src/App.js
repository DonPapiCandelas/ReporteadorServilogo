// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import ReportsPage from './components/ReportsPage';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminConsole from './components/AdminConsole';
import MainLayout from './components/MainLayout';

// Placeholder Dashboard Component
const Dashboard = () => (
  <MainLayout title="Dashboard">
    <div className="flex flex-col items-center justify-center h-[60vh] text-text-sub">
      <span className="material-symbols-outlined text-6xl mb-4 opacity-20">query_stats</span>
      <h2 className="text-xl font-bold text-text-main">Welcome to Analysis Core</h2>
      <p className="mt-2 text-sm">Select a module from the navigation menu to begin.</p>
    </div>
  </MainLayout>
);

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" /> : <Login />}
      />

      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* New Route for Accounts Receivable */}
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
  );
}

export default App;