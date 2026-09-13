import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  UserPlus
} from 'lucide-react';
import Card3D from '../components/Card3D';
import LoginVault3D from '../components/LoginVault3D';
import { authAPI } from '../services/api';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 25;
    if (password.length >= 10) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthColor = strength < 50 ? '#ef4444' : strength < 75 ? '#f59e0b' : '#10b981';
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId.trim()) {
      setError('User ID is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register(userId.trim(), password, confirmPassword);
      if (res.data && res.data.status === 'success') {
        setSuccess(`Account '${userId.trim()}' initialized successfully! Redirecting...`);
        setTimeout(() => {
          onRegisterSuccess();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. User ID may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1050px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem', alignItems: 'center' }}>
        
        {/* Left Side: Vault Core */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '20px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Register Account Vault
            </span>
          </div>

          <h1 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Initialize Your <br />
            <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Developer Identity
            </span>
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '420px', marginBottom: '1.5rem' }}>
            Create an isolated database workspace to maintain persistent audit history and predictive model checkpoints.
          </p>

          <LoginVault3D status={loading ? 'authenticating' : success ? 'success' : 'idle'} />
        </div>

        {/* Right Side: 3D Tilt Register Card */}
        <Card3D maxRotation={10}>
          <div
            className="card"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.15)',
              padding: '2.5rem 2.2rem',
              borderRadius: '16px'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                className="brand-icon"
                style={{
                  width: '52px',
                  height: '52px',
                  margin: '0 auto 0.85rem auto',
                  boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)'
                }}
              >
                <UserPlus size={26} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                Account Registration
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Set up your credentials for secure code review access
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">User ID</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Choose a unique ID (e.g. YASHAS002)"
                    required
                    autoFocus
                  />
                  <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Password (min 6 characters)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                {password && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', color: strengthColor }}>
                      <span>Strength</span>
                      <span>{strength < 50 ? 'Weak' : strength < 75 ? 'Moderate' : 'Strong'}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${strength}%`, background: strengthColor, transition: 'all 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                  />
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Create Account & Initialize'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Already registered?{' '}
                <button
                  onClick={onSwitchToLogin}
                  style={{ background: 'none', border: 'none', color: '#c084fc', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </Card3D>

      </div>
    </div>
  );
}
