import React, { useState } from 'react';
import { TestTube, Copy, Check } from 'lucide-react';

export default function TestCasesView({ tests = [] }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyToClipboard = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!tests || tests.length === 0) return null;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <TestTube size={20} color="#34d399" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
          Recommended Automated Unit Tests
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {tests.map((t, idx) => (
          <div
            key={idx}
            style={{
              background: '#090d16',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{t.file}</span>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                  {t.language}
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(t.code, idx)}
              >
                {copiedIdx === idx ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                {copiedIdx === idx ? 'Copied' : 'Copy Test'}
              </button>
            </div>
            <pre style={{ padding: '1rem', fontSize: '0.8rem', color: '#38bdf8', overflowX: 'auto' }}>
              {t.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
