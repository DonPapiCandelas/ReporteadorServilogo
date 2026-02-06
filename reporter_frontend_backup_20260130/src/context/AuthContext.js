// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const DEFAULT_COMPANY = 'growers_union';
const FALLBACK_COMPANIES = [
  { key: 'growers_union', name: 'Growers Union' },
  { key: 'sofresco', name: 'Sofresco GmbH' },
  { key: 'produce_lovers', name: 'Produce Lovers' },
];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Empresa seleccionada ---
  const [companyKey, setCompanyKeyState] = useState(localStorage.getItem('companyKey') || DEFAULT_COMPANY);
  const [companies, setCompanies] = useState([]);

  const setCompanyKey = useCallback((newKey) => {
    const key = newKey || DEFAULT_COMPANY;
    localStorage.setItem('companyKey', key);
    setCompanyKeyState(key);
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const res = await axios.get('/api/companies');
      const list = Array.isArray(res.data) ? res.data : [];
      setCompanies(list.length ? list : FALLBACK_COMPANIES);

      // si la empresa guardada ya no existe, usamos la primera
      const exists = list.some(c => c.key === (localStorage.getItem('companyKey') || companyKey));
      if (!exists && list.length) {
        setCompanyKey(list[0].key);
      }
    } catch (e) {
      console.warn('No se pudieron cargar empresas desde /api/companies, usando fallback.', e);
      setCompanies(FALLBACK_COMPANIES);
    }
  }, [companyKey, setCompanyKey]);

  useEffect(() => {
    // Interceptor que se ejecuta antes de CADA petición
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('userToken');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }

        // Multi-empresa: manda la empresa seleccionada
        const currentCompany = localStorage.getItem('companyKey') || DEFAULT_COMPANY;
        config.headers['X-Company'] = currentCompany;

        return config;
      },
      (error) => Promise.reject(error)
    );

    const initAuth = async () => {
      const storedToken = localStorage.getItem('userToken');
      if (storedToken) {
        try {
          const response = await axios.get('/api/users/me');
          setUser(response.data);
          setToken(storedToken);
          await loadCompanies();
          console.log("Sesión restaurada:", response.data.username);
        } catch (error) {
          console.log("Sesión expirada o inválida");
          logout();
        }
      } else {
        // sin sesión, igual deja lista de empresas para el selector
        setCompanies(FALLBACK_COMPANIES);
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (accessToken) => {
    localStorage.setItem('userToken', accessToken);
    setToken(accessToken);

    try {
      const response = await axios.get('/api/users/me');
      setUser(response.data);
      await loadCompanies();
    } catch (e) {
      console.error("Error al obtener datos de usuario tras login", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    token,
    user,
    login,
    logout,

    // multi-empresa
    companyKey,
    setCompanyKey,
    companies,
    reloadCompanies: loadCompanies,
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
