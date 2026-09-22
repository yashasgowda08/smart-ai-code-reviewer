import React, { useState } from 'react';
import { Code2, AlertCircle, ShieldAlert, Sparkles, Check } from 'lucide-react';

export default function CodeViewerAnnotated({ code = '', findings = [], filename = 'code.py', language = 'Python' }) {
  const [selectedFinding, setSelectedFinding] = useState(null);

  const safeCode = typeof code === 'string' ? code : '';
  const lines = safeCode.split('\n');
  const findingsByLine = {};
  const safeFindings = Array.isArray(findings) ? findings : [];
  safeFindings.forEach(f => {
    if (!f) return;
    const l = typeof f.line === 'number' ? f.line : 1;
    if (!findingsByLine[l]) findingsByLine[l] = [];
    findingsByLine[l].push(f);
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code2 size={18} color="#60a5fa" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
            Live Code Vulnerability Annotations ({filename})
          </h3>
        </div>
        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
          {language}
        </span>
      </div>

      <div style={{ background: '#070a12', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.5rem 0', fontFamily: "'Fira Code', monospace", fontSize: '0.82rem' }}>
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const lineFindings = findingsByLine[lineNum] || [];
            const hasFlaw = lineFindings.length > 0;
            const maxSev = hasFlaw && lineFindings[0]?.severity ? lineFindings[0].severity : 'LOW';
            const lineBg = maxSev === 'CRITICAL' ? 'rgba(239, 68, 68, 0.18)' : maxSev === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : maxSev === 'MEDIUM' ? 'rgba(245, 158, 11, 0.12)' : hasFlaw ? 'rgba(59, 130, 246, 0.1)' : 'transparent';

            return (
              <div
                key={lineNum}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  background: lineBg,
                  borderLeft: hasFlaw ? `3px solid ${maxSev === 'CRITICAL' || maxSev === 'HIGH' ? '#ef4444' : '#f59e0b'}` : '3px solid transparent',
                  padding: '0.15rem 0.5rem',
                  lineHeight: 1.4
                }}
              >
                <span style={{ width: '40px', textAlign: 'right', color: '#475569', userSelect: 'none', paddingRight: '0.75rem', fontSize: '0.75rem' }}>
                  {lineNum}
                </span>

                <div style={{ flex: 1, overflowX: 'auto', whiteSpace: 'pre', color: hasFlaw ? '#fff' : '#cbd5e1' }}>
                  {lineText || ' '}
                </div>

                {hasFlaw && (
                  <button
                    onClick={() => setSelectedFinding(selectedFinding?.line === lineNum ? null : lineFindings[0])}
                    style={{
                      marginLeft: '0.5rem',
                      background: maxSev === 'CRITICAL' || maxSev === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                      border: 'none',
                      color: maxSev === 'CRITICAL' || maxSev === 'HIGH' ? '#fca5a5' : '#fde68a',
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    {lineFindings.length} issue{lineFindings.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {selectedFinding && (
          <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span className={`badge badge-${(selectedFinding?.severity || 'low').toLowerCase()}`}>
                Line {selectedFinding.line}: {selectedFinding.title}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>{selectedFinding.cwe || selectedFinding.category}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', marginBottom: '0.4rem' }}>
              {selectedFinding.description}
            </p>
            <div style={{ fontSize: '0.8rem', color: '#34d399' }}>
              <b>Fix:</b> {selectedFinding.recommendation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
