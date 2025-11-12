// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';


// 1. Crear el Context
const AuthContext = createContext();

// 2. Crear el "Proveedor" (el componente que envuelve tu app)
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efecto que se ejecuta UNA SOLA VEZ cuando la app carga
  useEffect(() => {
    // Revisa si hay un token en la "memoria" del navegador
    const storedToken = localStorage.getItem('userToken');

    if (storedToken) {
      console.log("Found token in storage, verifying...");
      verifyToken(storedToken);
    } else {
      setLoading(false); // No hay token, termina de cargar
    }
  }, []); // El '[]' significa "ejecuta solo al montar"

  // Función para verificar el token con el endpoint /users/me
  const verifyToken = async (tokenToVerify) => {
    try {
      // Configura axios para USAR este token en todas las peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToVerify}`;

      // Llama al endpoint /users/me
      const response = await axios.get('/api/users/me');

      // Si el token es válido, la API devuelve los datos del usuario
      setUser(response.data); // Guarda los datos del usuario (id, username, is_admin)
      setToken(tokenToVerify); // Guarda el token en el estado
      console.log("Token verified, user set:", response.data);

    } catch (error) {
      // Si el token es inválido o expiró
      console.log("Token verification failed:", error);
      logout(); // Limpia el token inválido
    } finally {
      setLoading(false); // Termina de cargar
    }
  };

  // Función de Login: se llamará desde tu componente Login.js
  const login = async (accessToken) => {
    // Guarda el token en la "memoria" del navegador
    localStorage.setItem('userToken', accessToken);
    // Verifica el token para obtener los datos del usuario
    await verifyToken(accessToken);
  };

  // Función de Logout: se llamará desde tu componente Dashboard.js
  const logout = () => {
    // Limpia el token de la memoria y del estado
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    // Limpia la cabecera de axios
    delete axios.defaults.headers.common['Authorization'];
    console.log("User logged out.");
  };

  // El "valor" que compartiremos con toda la app
  const value = {
    token,
    user,
    login,
    logout
  };

  // No muestra la app hasta que sepa si el usuario está logueado o no
  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Crear el "Hook" (la forma fácil de usar el contexto)
export function useAuth() {
  return useContext(AuthContext);
}