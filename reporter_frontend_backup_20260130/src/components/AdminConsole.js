// src/components/AdminConsole.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';

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

  if (isLoading) return <MainLayout title="Admin Console"><div className="text-primary p-4">Loading users...</div></MainLayout>;
  if (error) return <MainLayout title="Admin Console"><div className="text-danger p-4">{error}</div></MainLayout>;

  const pendingUsers = users.filter(u => !u.is_active);
  const activeUsers = users.filter(u => u.is_active);

  return (
    <MainLayout title="User Management">
      <div className="space-y-6">

        {/* Creation form */}
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-sub mb-4">Register New User</h3>
          <form onSubmit={handleCreateUser} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-sub mb-1">Username</label>
              <input name="username" value={newUser.username} onChange={handleInputChange} required className="bg-background border border-border rounded px-3 py-1.5 text-xs text-text-main focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-sub mb-1">Password</label>
              <input name="password" type="password" value={newUser.password} onChange={handleInputChange} required className="bg-background border border-border rounded px-3 py-1.5 text-xs text-text-main focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-sub mb-1">First Name</label>
              <input name="first_name" value={newUser.first_name} onChange={handleInputChange} className="bg-background border border-border rounded px-3 py-1.5 text-xs text-text-main focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-sub mb-1">Last Name</label>
              <input name="last_name" value={newUser.last_name} onChange={handleInputChange} className="bg-background border border-border rounded px-3 py-1.5 text-xs text-text-main focus:border-primary outline-none" />
            </div>
            <button type="submit" className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded transition-colors">
              + Create User
            </button>
          </form>
          {creationMessage && <p className={`text-xs mt-2 ${creationMessage.includes('Error') ? 'text-danger' : 'text-success'}`}>{creationMessage}</p>}
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <div className="bg-surface border border-border rounded-md p-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-warning mb-4">Pending User Approvals ({pendingUsers.length})</h3>
            <UserTable
              users={pendingUsers}
              currentUser={currentUser}
              onApprove={handleApprove}
              onDelete={handleDeleteUser}
            />
          </div>
        )}

        {/* Active Users */}
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-success mb-4">Active Users ({activeUsers.length})</h3>
          <UserTable
            users={activeUsers}
            currentUser={currentUser}
            onToggleStatus={handleToggleStatus}
            onToggleAdmin={handleToggleAdmin}
            onEditProfile={openEditProfileModal}
            onChangePassword={openPasswordModal}
            onDelete={handleDeleteUser}
          />
        </div>

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
    </MainLayout>
  );
}

// User table
function UserTable({ users, currentUser, onApprove, onToggleStatus, onToggleAdmin, onEditProfile, onChangePassword, onDelete }) {
  if (users.length === 0) return <p className="text-text-sub text-xs">No users in this category.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full mini-table">
        <thead>
          <tr>
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Full Name</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Last Login</th>
            <th className="px-3 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-surface-lighter/50 transition-colors">
              <td className="px-3 py-2 text-text-sub">{u.id}</td>
              <td className="px-3 py-2 font-bold text-text-main">
                {u.username} {u.is_admin && <span className="text-danger text-[9px] ml-1">(Admin)</span>}
              </td>
              <td className="px-3 py-2 text-text-sub">{u.first_name} {u.last_name}</td>
              <td className="px-3 py-2">
                {u.is_active ? (
                  <span className="bg-success/20 text-success px-2 py-0.5 rounded-full text-[9px] font-bold">Active</span>
                ) : (
                  <span className="bg-warning/20 text-warning px-2 py-0.5 rounded-full text-[9px] font-bold">Pending</span>
                )}
              </td>
              <td className="px-3 py-2 text-text-sub text-[10px]">{formatDateTime(u.last_login)}</td>
              <td className="px-3 py-2 text-center">
                <div className="flex gap-2 justify-center flex-wrap">

                  {onApprove && (
                    <button onClick={() => onApprove(u.id)} className="px-2 py-1 bg-success hover:bg-success/80 text-white rounded text-[9px] font-bold transition-colors">
                      Approve
                    </button>
                  )}

                  {onToggleStatus && (
                    <button onClick={() => onToggleStatus(u)} disabled={u.id === currentUser.id} className={`px-2 py-1 text-white rounded text-[9px] font-bold transition-colors ${u.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''} ${u.is_active ? 'bg-warning hover:bg-warning/80' : 'bg-success hover:bg-success/80'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}

                  {onToggleAdmin && (
                    <button onClick={() => onToggleAdmin(u)} disabled={u.id === currentUser.id} className={`px-2 py-1 text-white rounded text-[9px] font-bold transition-colors ${u.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''} ${u.is_admin ? 'bg-text-sub hover:bg-gray-600' : 'bg-primary hover:bg-primary-dark'}`}>
                      {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  )}

                  {onEditProfile && (
                    <button onClick={() => onEditProfile(u)} className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[9px] font-bold transition-colors">
                      Edit
                    </button>
                  )}

                  {onChangePassword && (
                    <button onClick={() => onChangePassword(u)} className="px-2 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded text-[9px] font-bold transition-colors">
                      Pwd
                    </button>
                  )}

                  <button onClick={() => onDelete(u.id)} disabled={u.id === currentUser.id} className={`px-2 py-1 bg-danger hover:bg-danger/80 text-white rounded text-[9px] font-bold transition-colors ${u.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    Del
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border p-6 rounded-lg shadow-xl min-w-[400px] max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-text-main mb-4">{title}</h2>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-text-sub mb-1">First Name</label>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none" />
      </div>
      <div>
        <label className="block text-xs font-bold text-text-sub mb-1">Last Name</label>
        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none" />
      </div>
      {error && <p className="text-danger text-xs">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-text-sub/20 hover:bg-text-sub/30 text-text-main rounded text-xs font-bold transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-xs font-bold transition-colors">
          Save Changes
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-sub">Set new password for <strong className="text-text-main">{user.username}</strong>:</p>
      <div>
        <label className="block text-xs font-bold text-text-sub mb-1">New Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-text-main focus:border-primary outline-none" />
      </div>
      {error && <p className="text-danger text-xs">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-text-sub/20 hover:bg-text-sub/30 text-text-main rounded text-xs font-bold transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-xs font-bold transition-colors">
          Set Password
        </button>
      </div>
    </form>
  );
}

export default AdminConsole;