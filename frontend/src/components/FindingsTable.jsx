import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

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

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
          Detailed Inspection Findings ({filtered.length})
        </h3>
        
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
                <th style={{ width: '130px' }}>Category</th>
                <th style={{ width: '160px' }}>Location</th>
                <th>Description</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const isExpanded = expandedRow === idx;
                return (
                  <React.Fragment key={idx}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                    >
                      <td>{getSeverityBadge(item.severity)}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 500 }}>
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {item.file}:{item.line}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.title}</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.description}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '1rem' }}>
                          {item.code_snippet && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Snippet:</span>
                              <pre style={{ background: '#090d16', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', fontSize: '0.8rem', color: '#f87171' }}>
                                {item.code_snippet}
                              </pre>
                            </div>
                          )}
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>Remediation:</span>
                            <p style={{ fontSize: '0.85rem', color: '#d1fae5', marginTop: '0.2rem' }}>
                              {item.recommendation}
                            </p>
                          </div>
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
