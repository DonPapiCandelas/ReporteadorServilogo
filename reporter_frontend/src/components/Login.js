// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { useAuth } from '../context/AuthContext';
// 1. IMPORTAMOS useNavigate
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const { login } = useAuth();
  // 2. CREAMOS LA VARIABLE DE NAVEGACIÓN
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('password', password);

    try {
      const response = await axios.post('/api/token', loginData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const accessToken = response.data.access_token;

      // Iniciamos sesión
      login(accessToken);

      // 3. ¡LA LÍNEA MÁGICA! REDIRIGIR AL HOME
      navigate('/');

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please try again later.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="logo-text">Growers Union, L.L.C.</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (<p className="error-message">{error}</p>)}

          <button type="submit" className="login-button">
            Sign In
          </button>

          <Link to="/register" className="link-button">
            Don't have an account? Create one
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Login;