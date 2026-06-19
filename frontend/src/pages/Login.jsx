import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('customer'); // 'customer' or 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('customer@manikanta.com');
  const [password, setPassword] = useState('customerpassword');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default credentials when switching tabs
  useEffect(() => {
    if (!isRegistering) {
      if (role === 'customer') {
        setEmail('customer@manikanta.com');
        setPassword('customerpassword');
      } else {
        setEmail('admin@manikanta.com');
        setPassword('adminpassword');
      }
      setError('');
    }
  }, [role, isRegistering]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name || !email || !password) {
          throw new Error('All fields are required for registration.');
        }
        await register(name, email, password, role);
        setSuccess('Registration successful! Please login.');
        setIsRegistering(false);
      } else {
        if (!email || !password) {
          throw new Error('Email and password are required.');
        }
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h1 className="login-logo">Manikanta Enterprises</h1>
          <span className="login-logo-sub">Goods Supply Order Management System</span>
        </div>

        {/* Auth Mode Toggle Tabs (Only show role selection if registering or standard login) */}
        <div className="login-tabs">
          <div
            className={`login-tab ${role === 'customer' ? 'active' : ''}`}
            onClick={() => !loading && setRole('customer')}
          >
            Customer
          </div>
          <div
            className={`login-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => !loading && setRole('admin')}
          >
            Administrator
          </div>
        </div>

        <h3 className="mb-4 text-center" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          {isRegistering ? `Create ${role === 'admin' ? 'Admin' : 'Customer'} Account` : `Sign In as ${role === 'admin' ? 'Admin' : 'Customer'}`}
        </h3>

        {error && (
          <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
            <span className="text-danger" style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-delivered)', backgroundColor: '#F0FDF4', padding: '0.75rem 1rem' }}>
            <span className="text-success" style={{ fontSize: '0.875rem' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., example@domain.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a
            onClick={() => !loading && setIsRegistering(!isRegistering)}
            style={{ color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register here"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
