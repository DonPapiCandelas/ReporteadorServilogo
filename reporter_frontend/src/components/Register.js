// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await axios.post('/api/register', {
        username: username,
        password: password,
        first_name: firstName,
        last_name: lastName
      });
      setSuccess(true);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Registration failed.');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-main font-sans">
        <div className="w-full max-w-md p-8 bg-surface border border-border rounded-lg shadow-xl text-center">
          <div className="inline-flex items-center justify-center size-12 rounded bg-success text-white mb-4">
            <span className="material-symbols-outlined text-2xl">check</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Registration Submitted!</h1>
          <p className="text-sm text-text-sub mb-6">
            Your account is pending approval.<br />
            An administrator will review your request shortly.
          </p>
          <Link to="/login" className="inline-block px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text-main font-sans">
      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-sm text-text-sub mt-2">Fill in your details to register</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">First Name</label>
              <input
                type="text" id="firstName" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded px-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">Last Name</label>
              <input
                type="text" id="lastName" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded px-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="username" className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">Username</label>
            <input
              type="text" id="username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-background border border-border rounded px-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-text-sub uppercase tracking-wider mb-2">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-background border border-border rounded px-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm text-center">
              {error}
            </div>
          )}

          <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded transition-colors shadow-lg shadow-primary/20 mt-2">
            Register
          </button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary hover:text-primary-dark transition-colors">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;