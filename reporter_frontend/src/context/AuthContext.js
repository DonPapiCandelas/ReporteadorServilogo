// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. EL INTERCEPTOR MÁGICO
    // Este código se ejecuta antes de CADA petición que haga tu app
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Busca el token actualizado en localStorage justo antes de enviar
        const currentToken = localStorage.getItem('userToken');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Verificar si ya estamos logueados al iniciar
    const initAuth = async () => {
      const storedToken = localStorage.getItem('userToken');
      if (storedToken) {
        try {
          // Ya no necesitamos configurar defaults aquí, el interceptor lo hará
          const response = await axios.get('/api/users/me');
          setUser(response.data);
          setToken(storedToken);
          console.log("Sesión restaurada:", response.data.username);
        } catch (error) {
          console.log("Sesión expirada o inválida");
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Limpieza: quitamos el interceptor si el componente se desmonta
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const login = async (accessToken) => {
    localStorage.setItem('userToken', accessToken);
    setToken(accessToken);
    // Verificamos inmediatamente para obtener los datos del usuario
    try {
      const response = await axios.get('/api/users/me');
      setUser(response.data);
    } catch (e) {
      console.error("Error al obtener datos de usuario tras login", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    // Recargar la página para limpiar cualquier estado basura en memoria
    window.location.href = '/login';
  };

  const value = {
    token,
    user,
    login,
    logout
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Cargando autenticación...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}