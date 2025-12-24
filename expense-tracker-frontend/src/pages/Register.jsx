// src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/users/register', { name, email, password });
      // backend might return token or user object
      const token = res.data?.token || res.data?.data?.token || null;
      const username = res.data?.name || res.data?.user?.name || name || '';
      if (token) {
        login({ token, name: username });
        try { sessionStorage.setItem('token', token); if (username) sessionStorage.setItem('name', username); } catch(e){}
      } else {
        // if backend doesn't return token, still navigate to login
        toast.success('Registered — please login');
        navigate('/login');
        setLoading(false);
        return;
      }
      toast.success('Registered and logged in');
      navigate('/dashboard');
    } catch (err) {
      console.error('Register error', err);
      toast.error(err?.response?.data?.message || 'Failed to register');
    } finally { setLoading(false); }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth:520, margin:'40px auto' }}>
        <h3>Register</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row"><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required /></div>
          <div className="form-row"><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required /></div>
          <div className="form-row"><input className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" required /></div>
          <div style={{ textAlign:'right' }}><button className="btn" type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button></div>
        </form>
      </div>
    </div>
  );
}
