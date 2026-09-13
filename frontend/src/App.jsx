import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Review from './pages/Review';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import CyberSpace3D from './components/CyberSpace3D';
import { historyAPI } from './services/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(localStorage.getItem('user_id') || '');
  const [adminKey, setAdminKey] = useState(localStorage.getItem('admin_key') || '');
  const [authView, setAuthView] = useState('login');
  const [activePage, setActivePage] = useState('dashboard');
  const [reviewResult, setReviewResult] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (userId) => {
    setUser(userId);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    setUser('');
    setAuthView('login');
    setReviewResult(null);
  };

  const handleAdminSuccess = (key) => {
    setAdminKey(key);
    setActivePage('admin');
  };

  const handleExitAdmin = () => {
    localStorage.removeItem('admin_key');
    setAdminKey('');
    setActivePage('dashboard');
  };

  const handleViewReview = async (reviewId) => {
    try {
      const res = await historyAPI.getReview(reviewId);
      if (res.data && res.data.review && res.data.review.review_data) {
        setReviewResult(res.data.review.review_data);
        setActivePage('review');
      }
    } catch (err) {
      alert(err.message || 'Failed to load review details.');
    }
  };

  if (!user) {
    return (
      <div className="app-container">
        {/* Immersive 3D Space Background */}
        <CyberSpace3D />

        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          {authView === 'login' ? (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setAuthView('register')}
            />
          ) : (
            <Register
              onRegisterSuccess={() => setAuthView('login')}
              onSwitchToLogin={() => setAuthView('login')}
            />
          )}
        </div>

        <AdminLoginModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onAdminSuccess={handleAdminSuccess}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Immersive 3D Space Background */}
      <CyberSpace3D />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar
          activePage={activePage}
          setActivePage={(page) => {
            if (page === 'review' && activePage !== 'review') {
              setReviewResult(null);
            }
            setActivePage(page);
          }}
          user={user}
          onLogout={handleLogout}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          isAdminActive={Boolean(adminKey)}
        />

        <main className="main-content">
          {activePage === 'dashboard' && (
            <Dashboard
              setActivePage={setActivePage}
              onViewReview={handleViewReview}
            />
          )}

          {activePage === 'review' && (
            <Review
              reviewResult={reviewResult}
              setReviewResult={setReviewResult}
            />
          )}

          {activePage === 'history' && (
            <History
              onViewReview={handleViewReview}
            />
          )}

          {activePage === 'admin' && (
            <AdminDashboard
              onExitAdmin={handleExitAdmin}
            />
          )}
        </main>
      </div>

      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAdminSuccess={handleAdminSuccess}
      />
    </div>
  );
}
