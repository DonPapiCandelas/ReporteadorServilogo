// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // <-- ¡NUEVA IMPORTACIÓN!

function Login() {
  const { login } = useAuth();
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
      );
      const accessToken = response.data.access_token;
      login(accessToken);

    } catch (err) {
      if (err.response && err.response.data) {
        // ¡Ahora mostrará el error "Account not activated"!
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please try again later.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* ... (todos los input-group son iguales) ... */}
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text" id="username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin" required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password" required
            />
          </div>
          {error && (<p className="error-message">{error}</p>)}

          <button type="submit" className="login-button">
            Login
          </button>

          {/* --- ¡NUEVO ENLACE DE REGISTRO! --- */}
          <Link to="/register" className="link-button">
            Don't have an account? Create one
          </Link>

        </form>
      </div>
    </div>
  );
}

export default Login;