// src/components/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { token, user } = useAuth();

    if (!token) {
        // No está autenticado, redirigir al login
        return <Navigate to="/login" />;
    }

    if (!user || !user.is_admin) {
        // Está autenticado pero no es admin, redirigir al home
        return <Navigate to="/" />;
    }

    // Es admin, permitir acceso
    return children;
};

export default AdminRoute;
