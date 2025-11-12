// src/components/AdminConsole.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminConsole.css';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal'; // <-- ¡NUESTRO NUEVO MODAL!
import './Login.css'; // <-- Reusamos los estilos de formulario

// (La función 'formatDateTime' es la misma, la omito por brevedad...)
const formatDateTime = (isoString) => {
  if (!isoString) return "Never";
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch (e) { return "Invalid Date"; }
};

function AdminConsole() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser } = useAuth();

  // --- ¡NUEVO ESTADO PARA EL MODAL! ---
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'editProfile' o 'changePassword'
    user: null   // El usuario que estamos editando
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load users.');
    }
    setLoading(false);
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, user: null });
  };

  // --- Acciones del Administrador (¡ACTUALIZADAS!) ---

  const handleApprove = async (userId) => {
    // ... (sin cambios)
    try {
      await axios.put(`/api/users/${userId}/approve`);
      fetchUsers();
    } catch (err) {
      alert('Error approving user.');
    }
  };

  const handleToggleStatus = async (userToUpdate) => {
    // ... (sin cambios)
    const newStatus = !userToUpdate.is_active;
    try {
      await axios.put(`/api/users/${userToUpdate.id}/status`, { is_active: newStatus });
      fetchUsers();
    } catch (err) {
      alert('Error updating user status.');
    }
  };

  // ¡NUEVO! Estas funciones AHORA ABREN EL MODAL
  const openEditProfileModal = (userToEdit) => {
    setModalState({ isOpen: true, mode: 'editProfile', user: userToEdit });
  };

  const openPasswordModal = (userToEdit) => {
    setModalState({ isOpen: true, mode: 'changePassword', user: userToEdit });
  };

  // --- Lógica de Renderizado ---
  if (loading) return <div className="admin-container">Loading...</div>;
  if (error) return <div className="admin-container error-message">{error}</div>;

  const pendingUsers = users.filter(u => !u.is_active);
  const activeUsers = users.filter(u => u.is_active);

  return (
    <div className="admin-container">
      <h1>Admin Console</h1>

      <div className="admin-section">
        <h2>Pending Approval ({pendingUsers.length})</h2>
        {/* ... (sin cambios) ... */}
        <UserTable 
          users={pendingUsers} 
          currentUser={currentUser}
          onApprove={handleApprove}
        />
      </div>

      <div className="admin-section">
        <h2>Active Users ({activeUsers.length})</h2>
        {/* ... (sin cambios) ... */}
        <UserTable 
          users={activeUsers} 
          currentUser={currentUser}
          onToggleStatus={handleToggleStatus}
          onEditProfile={openEditProfileModal}     // <-- ¡Cableado!
          onChangePassword={openPasswordModal} // <-- ¡Cableado!
        />
      </div>

      {/* --- ¡NUESTRO MODAL RENDERIZADO! --- */}
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={closeModal}
        title={modalState.mode === 'editProfile' ? 'Edit Profile' : 'Set New Password'}
      >
        {/* Renderizado condicional del contenido del modal */}
        {modalState.mode === 'editProfile' && (
          <EditProfileForm 
            user={modalState.user} 
            onSuccess={() => {
              fetchUsers(); // Actualiza la tabla
              closeModal(); // Cierra el modal
            }}
            onCancel={closeModal}
          />
        )}

        {modalState.mode === 'changePassword' && (
          <ChangePasswordForm
            user={modalState.user}
            onSuccess={closeModal} // Solo cierra el modal
            onCancel={closeModal}
          />
        )}
      </Modal>

    </div>
  );
}

// --- Sub-Componente de Tabla (¡ACTUALIZADO!) ---
// (Actualizamos los onClick para que llamen a las nuevas funciones "open")
function UserTable({ 
  users, currentUser, onApprove, onToggleStatus, onEditProfile, onChangePassword 
}) {
  if (users.length === 0) return <p>No users in this category.</p>;

  return (
    <div className="table-container">
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Status</th>
            <th>Last Login</th>
            <th style={{width: '350px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username} {user.is_admin ? ' (Admin)' : ''}</td>
              <td>{user.first_name} {user.last_name}</td>
              <td>
                <span className={`status ${user.is_active ? 'status-active' : 'status-pending'}`}>
                  {user.is_active ? 'Active' : 'Pending'}
                </span>
              </td>
              <td>{formatDateTime(user.last_login)}</td>
              <td className="actions-cell">

                {onApprove && (
                  <button className="btn-action btn-approve" onClick={() => onApprove(user.id)}>
                    Approve
                  </button>
                )}

                {onToggleStatus && (
                  <button 
                    className={`btn-action ${user.is_active ? 'btn-block' : 'btn-unblock'}`}
                    onClick={() => onToggleStatus(user)}
                    disabled={user.id === currentUser.id}
                  >
                    {user.is_active ? 'Block' : 'Unblock'}
                  </button>
                )}
                {onEditProfile && (
                   <button 
                    className="btn-action btn-edit"
                    onClick={() => onEditProfile(user)} // <-- ¡Llama al "abridor" del modal!
                  >
                    Edit Profile
                  </button>
                )}
                {onChangePassword && (
                  <button 
                    className="btn-action btn-password"
                    onClick={() => onChangePassword(user)} // <-- ¡Llama al "abridor" del modal!
                  >
                    Set Password
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- ¡NUEVO SUB-COMPONENTE: Formulario de Editar Perfil! ---
function EditProfileForm({ user, onSuccess, onCancel }) {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.put(
        `/api/users/${user.id}/profile`,
        { first_name: firstName, last_name: lastName }
      );
      onSuccess(); // Llama a la función de éxito (refresca y cierra)
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="input-group">
        <label htmlFor="firstName">First Name</label>
        <input 
          type="text" id="firstName" value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="lastName">Last Name</label>
        <input 
          type="text" id="lastName" value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save Changes</button>
      </div>
    </form>
  );
}

// --- ¡NUEVO SUB-COMPONENTE: Formulario de Cambiar Contraseña! ---
function ChangePasswordForm({ user, onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.trim() === '') {
      setError('Password cannot be empty.');
      return;
    }
    setError('');
    try {
      await axios.put(
        `/api/users/${user.id}/password`,
        { new_password: password }
      );
      alert('Password updated successfully!');
      onSuccess(); // Llama a la función de éxito (cierra el modal)
    } catch (err) {
      setError('Failed to update password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <p>You are setting a new password for <strong>{user.username}</strong>.</p>
      <div className="input-group">
        <label htmlFor="newPassword">New Password</label>
        <input 
          type="password" id="newPassword" value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Set Password</button>
      </div>
    </form>
  );
}

export default AdminConsole;