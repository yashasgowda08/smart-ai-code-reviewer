import React, { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ArrowUpDown
} from 'lucide-react';
import { historyAPI, reviewAPI } from '../services/api';

export default function History({ onViewReview }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await historyAPI.getHistory();
      if (res.data && res.data.reviews) {
        setHistory(res.data.reviews);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve review history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm(`Are you sure you want to delete review '${reviewId}'?`)) return;
    try {
      await historyAPI.deleteReview(reviewId);
      setMessage(`Review '${reviewId}' deleted successfully.`);
      setHistory(history.filter(r => r.review_id !== reviewId));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete review.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL review history for your user account? This cannot be undone.')) return;
    try {
      await historyAPI.clearHistory();
      setMessage('All review history cleared.');
      setHistory([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to clear history.');
    }
  };

  const filtered = history.filter(r => {
    const term = String(searchTerm || '').toLowerCase();
    const matchesSearch =
      String(r?.target_name || '').toLowerCase().includes(term) ||
      String(r?.review_id || '').toLowerCase().includes(term) ||
      String(r?.language || '').toLowerCase().includes(term);
    const matchesRisk = riskFilter === 'ALL' || r.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Review History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Persistent SQLite review audit log isolated for your User ID.
          </p>
        </div>

        {history.length > 0 && (
          <button className="btn btn-danger" onClick={handleClearAll}>
            <Trash2 size={16} />
            Clear All History
          </button>
        )}
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by target, ID, or language..."
            />
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Risk Filter:</span>
          <select
            className="form-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading audit history...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FileCode size={40} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>
              {searchTerm || riskFilter !== 'ALL' ? 'No reviews matching your filters' : 'No history found'}
            </p>
            <p style={{ fontSize: '0.85rem' }}>All completed reviews are persistently stored in SQLite.</p>
          </div>
        ) : (
          <div className="custom-table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Review ID</th>
                  <th>Target</th>
                  <th>Language</th>
                  <th>Score</th>
                  <th>Risk Level</th>
                  <th>Agreement</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.review_id}>
                    <td>
                      <code style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                        {r.review_id}
                      </code>
                    </td>
                    <td>
                      <b>{r.target_name}</b>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.source_type}</div>
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
                          onClick={() => onViewReview(r.review_id)}
                          title="View Full Report"
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
                          onClick={() => handleDelete(r.review_id)}
                          title="Delete Review"
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
  );
}
