import React, { useState } from 'react';
import { Globe, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchAPI } from '../services/api';

export default function UrlFetchSection({ onReviewResult, loading, setLoading }) {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('auto');
  const [error, setError] = useState('');

  const sampleUrls = [
    { label: 'Python Raw Sample (GitHub)', url: 'https://raw.githubusercontent.com/pallets/flask/main/src/flask/app.py' },
    { label: 'JavaScript Sample (GitHub)', url: 'https://raw.githubusercontent.com/expressjs/express/master/lib/express.js' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchAPI.fetchUrl(url.trim(), language);
      if (res.data && res.data.data) {
        onReviewResult(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch and analyze URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Globe size={20} color="#60a5fa" />
        Fetch & Review Code from URL
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Provide any raw code link from GitHub, Gist, Pastebin, GitLab, or any public web endpoint.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
            Code File URL (Raw HTTP / HTTPS)
          </label>
          <input
            type="url"
            className="input-field"
            placeholder="https://raw.githubusercontent.com/owner/repo/main/file.py"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Target Language
            </label>
            <select
              className="input-field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="auto">Auto-Detect</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Java">Java</option>
              <option value="Go">Go</option>
              <option value="C++">C++</option>
              <option value="C">C</option>
              <option value="SQL">SQL</option>
            </select>
          </div>

          <div style={{ flex: 2, minWidth: '220px' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Quick Try:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sampleUrls.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setUrl(s.url)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !url.trim()}
          style={{ width: '100%' }}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              <ArrowRight size={16} />
              Fetch & Run Multi-Agent Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}
