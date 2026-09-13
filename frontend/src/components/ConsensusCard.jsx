import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

export default function ConsensusCard({ consensus, localScore, groqAi }) {
  if (!consensus) return null;

  const comp = consensus.comparison || {};
  const agreement = comp.agreement || 'HIGH';
  const confidence = consensus.confidence || 90;
  const groqScore = groqAi ? groqAi.overall_score : null;

  const getAgreementBadge = () => {
    if (agreement === 'HIGH') return <span className="badge badge-low">HIGH AGREEMENT</span>;
    if (agreement === 'MEDIUM') return <span className="badge badge-medium">MODERATE AGREEMENT</span>;
    return <span className="badge badge-high">DIVERGENCE DETECTED</span>;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={20} color="#8b5cf6" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
            Consensus & Confidence Engine
          </h3>
        </div>
        {getAgreementBadge()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local Multi-Agent</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>{localScore}/100</div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>External Groq AI</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a78bfa' }}>
            {groqScore !== null ? `${groqScore}/100` : 'Offline'}
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399' }}>{confidence}%</div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Delta</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f3f4f6' }}>{comp.score_difference || 0} pts</div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', borderLeft: '3px solid #8b5cf6', paddingLeft: '0.75rem' }}>
        "{consensus.explanation}"
      </p>
    </div>
  );
}
