import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileCode,
  Flame,
  Activity,
  Trash2,
  Download,
  Eye,
  Search,
  LogOut,
  RefreshCw,
  X
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import FindingsTable from '../components/FindingsTable';
import RecommendationsList from '../components/RecommendationsList';
import { adminAPI, reviewAPI, historyAPI } from '../services/api';
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function AdminDashboard({ onExitAdmin }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('all_reviews');
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, reviewsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getReviews()
      ]);

      if (statsRes.data && statsRes.data.data) setStats(statsRes.data.data);
      if (usersRes.data && usersRes.data.users) setUsers(usersRes.data.users);
      if (reviewsRes.data && reviewsRes.data.reviews) setReviews(reviewsRes.data.reviews);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(`Admin action: Permanently delete review '${reviewId}'?`)) return;
    try {
      await adminAPI.deleteReview(reviewId);
      setMessage(`Review '${reviewId}' deleted.`);
      setReviews(reviews.filter(r => r.review_id !== reviewId));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete review.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Admin action: Permanently delete user '${userId}' and all associated reviews?`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setMessage(`User '${userId}' deleted.`);
      setUsers(users.filter(u => u.user_id !== userId));
      setReviews(reviews.filter(r => r.user_id !== userId));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleInspectReview = async (reviewId) => {
    try {
      const res = await historyAPI.getReview(reviewId);
      if (res.data && res.data.review && res.data.review.review_data) {
        setSelectedReview(res.data.review.review_data);
      }
    } catch (err) {
      alert(err.message || 'Failed to inspect review.');
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesUser = userFilter === 'ALL' || r.user_id === userFilter;
    const matchesRisk = riskFilter === 'ALL' || r.risk_level === riskFilter;
    const term = String(searchTerm || '').toLowerCase();
    const matchesSearch =
      String(r?.target_name || '').toLowerCase().includes(term) ||
      String(r?.user_id || '').toLowerCase().includes(term) ||
      String(r?.review_id || '').toLowerCase().includes(term) ||
      String(r?.language || '').toLowerCase().includes(term);
    return matchesUser && matchesRisk && matchesSearch;
  });

  const riskPieData = stats?.risk_breakdown ? [
    { name: 'Low Risk', value: stats.risk_breakdown.LOW, color: '#10b981' },
    { name: 'Medium Risk', value: stats.risk_breakdown.MEDIUM, color: '#f59e0b' },
    { name: 'High Risk', value: stats.risk_breakdown.HIGH, color: '#ef4444' },
    { name: 'Critical', value: stats.risk_breakdown.CRITICAL, color: '#991b1b' },
  ].filter(d => d.value > 0) : [];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '1rem 1.5rem', background: 'rgba(153, 27, 27, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Admin Master Command Center
              </h1>
              <span className="badge badge-critical">MASTER OVERRIDE</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
              Viewing cross-account multi-user audits, telemetry & persistent storage.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={loadAllAdminData} title="Refresh Data">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="btn btn-danger" onClick={onExitAdmin}>
            <LogOut size={15} />
            Exit Admin Mode
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          title="Total Platform Users"
          value={stats?.total_users || users.length}
          sub="Registered accounts"
          icon={Users}
          color="#38bdf8"
        />
        <MetricCard
          title="Global Reviews Audited"
          value={stats?.total_reviews || reviews.length}
          sub="Across all developer accounts"
          icon={FileCode}
          color="#a855f7"
        />
        <MetricCard
          title="Global Avg Quality"
          value={`${stats?.avg_quality_score || 0}/100`}
          sub="System-wide average score"
          icon={Activity}
          color="#10b981"
        />
        <MetricCard
          title="Global High Risk Count"
          value={(stats?.risk_breakdown?.HIGH || 0) + (stats?.risk_breakdown?.CRITICAL || 0)}
          sub="Critical & high risk reviews"
          icon={Flame}
          color="#ef4444"
        />
      </div>

      <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'all_reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('all_reviews')}
        >
          <FileCode size={16} />
          All Users Review Stream ({reviews.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Registered Users Directory ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Activity size={16} />
          System Analytics & Telemetry
        </button>
      </div>

      {activeTab === 'all_reviews' && (
        <div>
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user, target, or review ID..."
                />
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter User:</span>
                <select
                  className="form-select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <option value="ALL">All Users ({users.length})</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.user_id}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter Risk:</span>
                <select
                  className="form-select"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading master review database...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                No reviews found across accounts.
              </div>
            ) : (
              <div className="custom-table-wrap">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User Account</th>
                      <th>Target & Review ID</th>
                      <th>Language</th>
                      <th>Score</th>
                      <th>Risk Level</th>
                      <th>Agreement</th>
                      <th>Timestamp</th>
                      <th style={{ textAlign: 'right' }}>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((r) => (
                      <tr key={r.review_id}>
                        <td>
                          <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', fontWeight: 700 }}>
                            {r.user_id}
                          </span>
                        </td>
                        <td>
                          <b>{r.target_name}</b>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.review_id} ? {r.source_type}</div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                            {r.language}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: r.overall_score >= 80 ? '#34d399' : r.overall_score >= 60 ? '#fbbf24' : '#f87171' }}>
                            {r.overall_score}/100
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${r.risk_level.toLowerCase()}`}>
                            {r.risk_level} ({r.risk_score}%)
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                            {r.consensus_agreement} ({r.confidence}%)
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {r.created_at}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => handleInspectReview(r.review_id)}
                              title="Inspect Review Data"
                            >
                              <Eye size={14} />
                            </button>
                            {r.pdf_filename && (
                              <a
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                href={reviewAPI.getReportUrl(r.pdf_filename)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </a>
                            )}
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteReview(r.review_id)}
                              title="Admin Delete Review"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
            Registered Developer Accounts ({users.length})
          </h3>
          <div className="custom-table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Registered On</th>
                  <th>Total Reviews</th>
                  <th>Avg Code Score</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id}>
                    <td>
                      <b style={{ color: '#60a5fa' }}>{u.user_id}</b>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {u.created_at}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                        {u.total_reviews} review{u.total_reviews !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>
                        {u.avg_score !== 'N/A' ? `${u.avg_score}/100` : 'N/A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteUser(u.user_id)}
                        title="Delete User Account"
                      >
                        <Trash2 size={14} />
                        Delete User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Global Risk Level Distribution
            </h3>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {riskPieData.map((e, idx) => (
                      <Cell key={`cell-p-${idx}`} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Language Usage Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(stats?.language_distribution || {}).map(([lang, count]) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 600, color: '#93c5fd' }}>{lang}</span>
                  <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#fff' }}>{count} file(s)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#0b0f19', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', marginBottom: '0.25rem' }}>
                  Auditing User: {selectedReview.user_id}
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                  {selectedReview.target_name} ({selectedReview.review_id})
                </h2>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399' }}>{selectedReview.scores?.overall}/100</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{selectedReview.predictions?.overall_risk}%</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Level</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>{selectedReview.predictions?.risk_level}</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{selectedReview.consensus?.confidence}%</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <FindingsTable findings={selectedReview.findings || []} />
            </div>

            <RecommendationsList recommendations={selectedReview.recommendations || []} />
          </div>
        </div>
      )}
    </div>
  );
}
