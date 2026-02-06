// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const { login } = useAuth();
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
      login(accessToken);
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
    <div className="min-h-screen flex items-center justify-center bg-background text-text-main font-sans">
      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded bg-primary text-white mb-4">
            <span className="material-symbols-outlined text-2xl">query_stats</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Growers Union, L.L.C.</h1>
          <p className="text-sm text-text-sub mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-background border border-border rounded px-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background border border-border rounded px-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm text-center">
              {error}
            </div>
          )}

          <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded transition-colors shadow-lg shadow-primary/20">
            Sign In
          </button>

          <div className="text-center mt-4">
            <Link to="/register" className="text-sm text-primary hover:text-primary-dark transition-colors">
              Don't have an account? Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;