// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    // Si el contexto aún está cargando (verificando el token), mostramos nada o un spinner
    if (loading) {
        return <div>Cargando...</div>;
    }

    // Si no hay token, mandamos al usuario al Login
    if (!token) {
        return <Navigate to="/login" />;
    }

    // Si hay token, dejamos pasar al componente hijo (ReportsPage)
    return children;
};

export default PrivateRoute;