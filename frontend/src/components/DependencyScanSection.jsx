import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Box, ArrowRight } from 'lucide-react';
import { fetchAPI } from '../services/api';

const SAMPLE_REQ = `flask==0.12
requests==2.19
pillow==8.0.0
django==3.0.1
pyyaml==5.1
numpy==1.22.0
`;

const SAMPLE_PKG = `{
  "dependencies": {
    "lodash": "4.17.20",
    "axios": "0.21.0",
    "express": "4.17.0",
    "minimist": "1.2.5"
  }
}`;

export default function DependencyScanSection() {
  const [filename, setFilename] = useState('requirements.txt');
  const [content, setContent] = useState(SAMPLE_REQ);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileType = (type) => {
    if (type === 'python') {
      setFilename('requirements.txt');
      setContent(SAMPLE_REQ);
    } else {
      setFilename('package.json');
      setContent(SAMPLE_PKG);
    }
    setResult(null);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetchAPI.scanDependencies(content, filename);
      if (res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Dependency security scan failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box size={20} color="#10b981" />
            Dependency & Package Vulnerability Scanner
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Audit Python (requirements.txt) or Node.js (package.json) dependencies against known security vulnerabilities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${filename === 'requirements.txt' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            onClick={() => handleFileType('python')}
          >
            requirements.txt
          </button>
          <button
            type="button"
            className={`btn ${filename === 'package.json' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            onClick={() => handleFileType('node')}
          >
            package.json
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleScan}>
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            className="input-field"
            style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste package dependencies..."
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !content.trim()}
          style={{ width: '100%', marginBottom: '1.5rem' }}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              <ShieldCheck size={16} />
              Scan Dependencies for Vulnerabilities
            </>
          )}
        </button>
      </form>

      {result && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Scan Results: {result.filename}
            </span>
            <span className="badge" style={{ background: result.vulnerable_packages_found > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: result.vulnerable_packages_found > 0 ? '#f87171' : '#34d399' }}>
              {result.vulnerable_packages_found} Vulnerable Packages Detected
            </span>
          </div>

          {result.findings && result.findings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.findings.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.95rem' }}>
                      {f.package} (version {f.version})
                    </span>
                    <span className="badge badge-high">{f.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0.2rem 0' }}>
                    ?? Vulnerable below version <strong>{f.vulnerable_below}</strong>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ?? {f.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.9rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <CheckCircle2 size={18} />
              <span>All packages appear healthy with no critical vulnerabilities in local database.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
