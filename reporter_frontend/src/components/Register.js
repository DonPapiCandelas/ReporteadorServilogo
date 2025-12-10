// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Para el enlace "Back to Login"
import './Login.css'; // Reutilizaremos los estilos del login

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // ¡Nuevo estado de éxito!

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      // Llama al endpoint de registro público
      await axios.post('/api/register', {
        username: username,
        password: password,
        first_name: firstName,
        last_name: lastName
      });

      // ¡Éxito!
      setSuccess(true);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Registration failed.');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  // Si el registro fue exitoso, muestra solo el mensaje
  if (success) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Registration Submitted!</h1>
          <p className="login-subtitle" style={{ color: '#16a34a', fontWeight: 600 }}>
            Your account is pending approval.
            <br />
            An administrator will review your request shortly.
          </p>
          <Link to="/login" className="login-button" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Si no, muestra el formulario de registro
  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">Fill in your details to register</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text" id="firstName" value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text" id="lastName" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text" id="username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (<p className="error-message">{error}</p>)}

          <button type="submit" className="login-button">
            Register
          </button>

          <Link to="/login" className="link-button">
            Already have an account? Login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Register;