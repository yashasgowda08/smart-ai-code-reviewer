import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, CheckCircle2, Sparkles } from 'lucide-react';

export default function FindingsTable({ findings = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState(null);

  const filtered = filter === 'ALL' ? findings : findings.filter(f => f.severity === filter);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="badge badge-critical">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-high">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="badge badge-low">LOW</span>;
    }
  };

  const getConfidenceBadge = (conf) => {
    const val = Number(conf) || 80;
    const bg = val >= 90 ? 'rgba(16, 185, 129, 0.15)' : val >= 75 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    const color = val >= 90 ? '#34d399' : val >= 75 ? '#60a5fa' : '#fbbf24';
    return (
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          background: bg,
          color: color,
          border: '1px solid ' + color + '33'
        }}
      >
        {val}% Conf
      </span>
    );
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            File & Line-Level Inspection Findings ({filtered.length})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
            Multi-agent verified defects with confidence scoring, deterministic AST rules, and suggested patches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              className={`btn btn-secondary ${filter === s ? 'active' : ''}`}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                background: filter === s ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                color: filter === s ? '#fff' : 'var(--text-muted)',
                borderColor: filter === s ? '#3b82f6' : 'var(--border-color)'
              }}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No findings matching the selected filter.
        </div>
      ) : (
        <div className="custom-table-wrap">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Severity</th>
                <th style={{ width: '95px' }}>Confidence</th>
                <th style={{ width: '120px' }}>Category</th>
                <th style={{ width: '160px' }}>Location</th>
                <th>Issue & Explanation</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const isExpanded = expandedRow === idx;
                const issueTitle = item.issue || item.title || 'Code Defect';
                const explanation = item.explanation || item.description || '';
                const fix = item.suggested_fix || item.recommendation || '';
                const sources = Array.isArray(item.sources) ? item.sources : (item.source ? [item.source] : []);

                return (
                  <React.Fragment key={idx}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                    >
                      <td>{getSeverityBadge(item.severity)}</td>
                      <td>{getConfidenceBadge(item.confidence)}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 500 }}>
                          {item.category || 'General'}
                        </span>
                        {item.cwe && (
                          <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
                            {item.cwe}
                          </div>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {item.file}:{item.line || 1}
                        </code>
                        {item.verified && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', color: '#34d399', fontWeight: 600, marginLeft: '0.35rem' }}>
                            <CheckCircle2 size={11} /> Verified
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{issueTitle}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px' }}>
                          {explanation}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: 'rgba(15, 23, 42, 0.95)', padding: '1.1rem' }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Explanation & Root Cause:
                            </span>
                            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: '1.5' }}>
                              {explanation}
                            </p>
                          </div>

                          {item.code_snippet && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                                Code Snippet:
                              </span>
                              <pre style={{ background: '#090d16', padding: '0.5rem 0.75rem', borderRadius: '4px', marginTop: '0.25rem', fontSize: '0.8rem', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                {item.code_snippet}
                              </pre>
                            </div>
                          )}

                          {fix && (
                            <div style={{ marginBottom: '0.6rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Sparkles size={13} /> Suggested Fix & Remediation:
                              </span>
                              <div style={{ background: '#030712', padding: '0.6rem 0.8rem', borderRadius: '4px', marginTop: '0.25rem', fontSize: '0.82rem', color: '#d1fae5', border: '1px solid rgba(16,185,129,0.25)' }}>
                                {fix}
                              </div>
                            </div>
                          )}

                          {sources.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <span style={{ fontWeight: 600 }}>Detected by:</span>
                              {sources.map((s, si) => (
                                <span key={si} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#e2e8f0' }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
