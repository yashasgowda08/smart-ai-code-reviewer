import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertCircle, ArrowRight, X } from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminLoginModal({ isOpen, onClose, onAdminSuccess }) {
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuickFill = () => {
    setSecretKey('ADMIN_SUPER_KEY_2026_AI_REVIEWER');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!secretKey.trim()) {
      setError('Secret admin access passkey is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.verifyPasskey(secretKey.trim());
      if (res.data && res.data.status === 'success') {
        localStorage.setItem('admin_key', res.data.admin_key);
        onAdminSuccess(res.data.admin_key);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Access Denied: Invalid secret admin security key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 50px rgba(239, 68, 68, 0.25)', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 0.75rem auto', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444, #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Restricted Admin Portal
          </h2>
          <span className="badge badge-critical" style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}>
            CONFIDENTIAL / MASTER AUDIT ACCESS
          </span>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Secret Security Passkey</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.5rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret admin key..."
                required
                autoFocus
              />
              <KeyRound size={18} color="#f87171" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Demo Key:</span>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              Fill Default Key
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Verifying Authorization...' : 'Unlock Admin Command Center'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1.25rem' }}>
          Shortcut: Press <kbd style={{ background: '#1e293b', padding: '0.1rem 0.3rem', borderRadius: '3px', color: '#93c5fd' }}>Ctrl+Shift+A</kbd> anytime to open
        </p>
      </div>
    </div>
  );
}
