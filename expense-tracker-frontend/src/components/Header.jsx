// src/components/Header.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="app-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          Micro Expense Tracker
        </div>
        {user?.name && <div className="small muted">Hi, <strong style={{marginLeft:6}}>{user.name}</strong></div>}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <button className="nav-btn" onClick={() => navigate('/reports')}>Reports</button>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
