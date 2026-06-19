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
  const [showPassword, setShowPassword] = useState(false);

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
      let msg = err.message || 'Authentication failed. Please try again.';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        msg = 'Connection to server failed. Note: The free cloud backend takes ~50 seconds to wake up on the first request. Please wait 30 seconds and try again!';
      }
      setError(msg);
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
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-color)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
