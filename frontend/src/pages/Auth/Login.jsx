import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('doctor1@clinicflow.com'); // Mock data prefilled
  const [password, setPassword] = useState('password123');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      // Role-based redirection
      if (data.user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else if (data.user.role === 'patient') {
        navigate('/patient-dashboard');
      } else {
        alert('Admin dashboard not configured yet');
      }
    } catch (error) {
      alert('Login Failed! ' + (error.response?.data?.message || 'Check console'));
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Clinic Flow Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '12px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
