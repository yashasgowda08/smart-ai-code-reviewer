import React, { useState } from 'react';
import {
  MessageSquareCode,
  Shield,
  Copy,
  Check,
  FileCode,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function PRCommentsSection({ comments = [] }) {
  const [selectedFile, setSelectedFile] = useState('ALL');
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!comments || comments.length === 0) return null;

  const files = ['ALL', ...Array.from(new Set(comments.map(c => c.file).filter(Boolean)))];
  const filtered = selectedFile === 'ALL' ? comments : comments.filter(c => c.file === selectedFile);

  const handleCopyComment = (idx, markdown) => {
    navigator.clipboard.writeText(markdown);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW':
      default: return '#3b82f6';
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquareCode size={19} color="#3b82f6" />
            Line-Pinned Pull Request Review Comments ({filtered.length})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            GitHub-ready review comments anchored to exact line coordinates with verified fixes and suggestions.
          </p>
        </div>

        {files.length > 2 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {files.map(f => (
              <button
                key={f}
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedFile(f)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  background: selectedFile === f ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                  borderColor: selectedFile === f ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                  color: selectedFile === f ? '#93c5fd' : '#cbd5e1'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((c, idx) => {
          const sevColor = getSeverityColor(c.severity);
          return (
            <div
              key={idx}
              style={{
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: `3px solid ${sevColor}`,
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* Header Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.9rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <code style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#e2e8f0' }}>
                    {c.file} : Line {c.line}
                  </code>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: `${sevColor}22`,
                      color: sevColor,
                      border: `1px solid ${sevColor}44`
                    }}
                  >
                    {c.severity}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    {c.confidence}% Confidence
                  </span>
                  {c.cwe && (
                    <span style={{ fontSize: '0.7rem', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                      {c.cwe}
                    </span>
                  )}
                  {c.category && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {c.category}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCopyComment(idx, c.comment_markdown)}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copiedIdx === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  {copiedIdx === idx ? 'Copied' : 'Copy GitHub Comment'}
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '0.9rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                  {c.issue}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.45', marginBottom: '0.75rem' }}>
                  {c.explanation}
                </p>

                {/* Suggested Fix */}
                {c.suggested_fix && (
                  <div style={{ background: '#030712', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.65rem 0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <Sparkles size={13} />
                      Suggested Code Fix
                    </div>
                    <pre style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {c.suggested_fix}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
