import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Cpu,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Terminal,
  KeyRound
} from 'lucide-react';
import LoginVault3D from '../components/LoginVault3D';
import Card3D from '../components/Card3D';
import { authAPI } from '../services/api';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authStatus, setAuthStatus] = useState('idle'); // 'idle' | 'authenticating' | 'success' | 'error'

  const handleQuickFill = (u, p) => {
    setUserId(u);
    setPassword(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId.trim() || !password) {
      setError('Please enter both User ID and Password.');
      setAuthStatus('error');
      return;
    }

    setLoading(true);
    setAuthStatus('authenticating');

    try {
      const res = await authAPI.login(userId.trim(), password);
      if (res.data && res.data.status === 'success') {
        setAuthStatus('success');
        localStorage.setItem('user_id', res.data.user_id);
        setTimeout(() => {
          onLoginSuccess(res.data.user_id);
        }, 500);
      }
    } catch (err) {
      setAuthStatus('error');
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', overflow: 'hidden' }}>
      
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1140px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3rem', alignItems: 'center' }}>
        
        {/* Left Side: 3D Holographic Vault & System Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', marginBottom: '1rem' }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              3D Quantum Security Gateway
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Smart Multi-Agent <br />
            <span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Code Reviewer
            </span>
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '440px', marginBottom: '1.5rem' }}>
            Enter your credentials to access your isolated review telemetry, predictive defect analytics, and Groq consensus reports.
          </p>

          {/* Interactive 3D Holographic Vault */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0.5rem 0' }}>
            <LoginVault3D status={authStatus} />
          </div>

          {/* 3D Telemetry Micro-Pill Matrix */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '420px', marginTop: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.72rem' }}>
              ?? AES-256 PERSISTENT DB
            </span>
            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.72rem' }}>
              ? 5 AGENT PIPELINE
            </span>
            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '0.72rem' }}>
              ?? GROQ AI READY
            </span>
          </div>
        </div>

        {/* Right Side: 3D Physics Tilt Glassmorphic Login Card */}
        <Card3D maxRotation={10}>
          <div
            className="card"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.12)',
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
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px'
                }}
              >
                <KeyRound size={26} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                Secure Developer Portal
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Authenticate to launch isolated code inspection session
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>User ID</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>e.g. YASHAS001</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter unique User ID"
                    required
                    autoFocus
                  />
                  <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    required
                  />
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Demo Quick Fill Chip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Demo Preset:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('YASHAS001', 'Password123!')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  title="Auto-fill verified demo account"
                >
                  ? Fill YASHAS001
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Synchronizing 3D Core...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Enter Deck</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Don't have an account yet?{' '}
                <button
                  onClick={onSwitchToRegister}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Create new access key
                </button>
              </p>
            </div>
          </div>
        </Card3D>

      </div>
    </div>
  );
}
