import React from 'react';
import { Shield, LayoutDashboard, FileCode, History, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, user, onLogout, onOpenAdmin, isAdminActive }) {
  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActivePage('dashboard')}>
        <div className="brand-icon">
          <Shield size={20} />
        </div>
        <span className="brand-title">Smart AI Reviewer</span>
        <span className="brand-badge">v2.0.0</span>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePage('dashboard')}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        <button
          className={`nav-link ${activePage === 'review' ? 'active' : ''}`}
          onClick={() => setActivePage('review')}
        >
          <FileCode size={16} />
          New Review
        </button>
        <button
          className={`nav-link ${activePage === 'history' ? 'active' : ''}`}
          onClick={() => setActivePage('history')}
        >
          <History size={16} />
          History
        </button>

        {isAdminActive && (
          <button
            className={`nav-link ${activePage === 'admin' ? 'active' : ''}`}
            onClick={() => setActivePage('admin')}
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <ShieldAlert size={16} />
            Admin Center
          </button>
        )}
      </nav>

      <div className="nav-user-section">
        <button
          onClick={onOpenAdmin}
          title="Secret Admin Access (Ctrl+Shift+A)"
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.3rem' }}
        >
          <ShieldAlert size={16} />
        </button>

        <div className="user-badge">
          <UserIcon size={14} color="#60a5fa" />
          <span>{user || 'Guest'}</span>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Log out">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
}
