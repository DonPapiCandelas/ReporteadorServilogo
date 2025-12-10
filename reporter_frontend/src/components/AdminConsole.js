// src/components/AdminConsole.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminConsole.css';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

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
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation form
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [creationMessage, setCreationMessage] = useState('');

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'editProfile' or 'changePassword'
    user: null
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/');
      setUsers(response.data);
      setIsLoading(false);
    } catch (err) {
      setError('Error fetching users. Are you admin?');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreationMessage('');
    try {
      await axios.post('/api/users/', newUser);
      setCreationMessage('User created successfully. Pending approval.');
      setNewUser({ username: '', password: '', first_name: '', last_name: '' });
      fetchUsers();
    } catch (err) {
      setCreationMessage('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Approve user
  const handleApprove = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/status?is_active=true`);
      fetchUsers();
    } catch (err) {
      alert("Error approving user: " + (err.response?.data?.detail || err.message));
    }
  };

  // Toggle status (activate/deactivate)
  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    try {
      await axios.put(`/api/users/${user.id}/status?is_active=${newStatus}`);
      fetchUsers();
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.detail || err.message));
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/api/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert("Error deleting user: " + (err.response?.data?.detail || err.message));
    }
  };

  // Toggle admin
  const handleToggleAdmin = async (user) => {
    const newStatus = !user.is_admin;
    try {
      await axios.put(`/api/users/${user.id}/role?is_admin=${newStatus}`);
      fetchUsers();
    } catch (err) {
      alert("Error updating role: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const openEditProfileModal = (user) => {
    setModalState({ isOpen: true, mode: 'editProfile', user });
  };

  const openPasswordModal = (user) => {
    setModalState({ isOpen: true, mode: 'changePassword', user });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, user: null });
  };

  if (isLoading) return <Layout title="Admin Console"><div>Loading users...</div></Layout>;
  if (error) return <Layout title="Admin Console"><div className="error">{error}</div></Layout>;

  const pendingUsers = users.filter(u => !u.is_active);
  const activeUsers = users.filter(u => u.is_active);

  return (
    <Layout title="User Management">
      <div className="admin-console-container" style={{ padding: '20px' }}>
        <h1>Admin Console</h1>

        {/* Creation form */}
        <div className="create-user-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0 }}>Register New User</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Username</label>
              <input name="username" value={newUser.username} onChange={handleInputChange} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Password</label>
              <input name="password" type="password" value={newUser.password} onChange={handleInputChange} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>First Name</label>
              <input name="first_name" value={newUser.first_name} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Last Name</label>
              <input name="last_name" value={newUser.last_name} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Create User
            </button>
          </form>
          {creationMessage && <p style={{ color: creationMessage.includes('Error') ? 'red' : 'green', marginTop: '10px' }}>{creationMessage}</p>}
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3>Pending User Approvals ({pendingUsers.length})</h3>
            <UserTable
              users={pendingUsers}
              currentUser={currentUser}
              onApprove={handleApprove}
              onDelete={handleDeleteUser}
            />
          </div>
        )}

        {/* Active Users */}
        <h3>Active Users ({activeUsers.length})</h3>
        <UserTable
          users={activeUsers}
          currentUser={currentUser}
          onToggleStatus={handleToggleStatus}
          onToggleAdmin={handleToggleAdmin}
          onEditProfile={openEditProfileModal}
          onChangePassword={openPasswordModal}
          onDelete={handleDeleteUser}
        />

        {/* Modal */}
        <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.mode === 'editProfile' ? 'Edit Profile' : 'Change Password'}>
          {modalState.mode === 'editProfile' && (
            <EditProfileForm user={modalState.user} onSuccess={() => { fetchUsers(); closeModal(); }} onCancel={closeModal} />
          )}
          {modalState.mode === 'changePassword' && (
            <ChangePasswordForm user={modalState.user} onSuccess={closeModal} onCancel={closeModal} />
          )}
        </Modal>
      </div>
    </Layout>
  );
}

// User table
function UserTable({ users, currentUser, onApprove, onToggleStatus, onToggleAdmin, onEditProfile, onChangePassword, onDelete }) {
  if (users.length === 0) return <p>No users in this category.</p>;

  return (
    <div className="table-responsive">
      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Username</th>
            <th style={{ padding: '12px' }}>Full Name</th>
            <th style={{ padding: '12px' }}>Status</th>
            <th style={{ padding: '12px' }}>Last Login</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{u.id}</td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>
                {u.username} {u.is_admin && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>(Admin)</span>}
              </td>
              <td style={{ padding: '12px' }}>{u.first_name} {u.last_name}</td>
              <td style={{ padding: '12px' }}>
                {u.is_active ? (
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Active</span>
                ) : (
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pending</span>
                )}
              </td>
              <td style={{ padding: '12px', fontSize: '0.85rem' }}>{formatDateTime(u.last_login)}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>

                  {onApprove && (
                    <button onClick={() => onApprove(u.id)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      Approve
                    </button>
                  )}

                  {onToggleStatus && (
                    <button onClick={() => onToggleStatus(u)} disabled={u.id === currentUser.id} style={{ padding: '6px 12px', background: u.is_active ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', opacity: u.id === currentUser.id ? 0.5 : 1 }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}

                  {onToggleAdmin && (
                    <button onClick={() => onToggleAdmin(u)} disabled={u.id === currentUser.id} style={{ padding: '6px 12px', background: u.is_admin ? '#6b7280' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', opacity: u.id === currentUser.id ? 0.5 : 1 }}>
                      {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  )}

                  {onEditProfile && (
                    <button onClick={() => onEditProfile(u)} style={{ padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      Edit Profile
                    </button>
                  )}

                  {onChangePassword && (
                    <button onClick={() => onChangePassword(u)} style={{ padding: '6px 12px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      Change Password
                    </button>
                  )}

                  <button onClick={() => onDelete(u.id)} disabled={u.id === currentUser.id} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', opacity: u.id === currentUser.id ? 0.5 : 1 }}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '8px', minWidth: '400px', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// Edit profile form
function EditProfileForm({ user, onSuccess, onCancel }) {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.put(`/api/users/${user.id}/profile?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`);
      onSuccess();
    } catch (err) {
      setError('Error updating profile: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name</label>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name</label>
        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
      </div>
      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Save
        </button>
      </div>
    </form>
  );
}

// Change password form
function ChangePasswordForm({ user, onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.trim() === '') {
      setError('Password cannot be empty');
      return;
    }
    setError('');
    try {
      await axios.put(`/api/users/${user.id}/password?new_password=${encodeURIComponent(password)}`);
      alert('Password updated successfully');
      onSuccess();
    } catch (err) {
      setError('Error updating password: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p>Set new password for <strong>{user.username}</strong>:</p>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
      </div>
      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Set Password
        </button>
      </div>
    </form>
  );
}

export default AdminConsole;