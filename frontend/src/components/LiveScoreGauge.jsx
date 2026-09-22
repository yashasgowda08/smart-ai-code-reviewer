import React from 'react';

export default function LiveScoreGauge({ score = 90, riskScore = 15, riskLevel = 'LOW', size = 180 }) {
  const safeRiskLevel = (riskLevel && typeof riskLevel === 'string') ? riskLevel : 'LOW';
  const safeScore = typeof score === 'number' && !isNaN(score) ? Math.max(0, Math.min(100, score)) : 0;
  const safeRiskScore = typeof riskScore === 'number' && !isNaN(riskScore) ? riskScore : 0;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeScore / 100) * circumference;

  const scoreColor = safeScore >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const riskColor = safeRiskLevel === 'LOW' ? '#10b981' : riskLevel === 'MEDIUM' ? '#f59e0b' : riskLevel === 'HIGH' ? '#ef4444' : '#991b1b';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: size, height: size, marginBottom: '0.75rem' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
              filter: `drop-shadow(0 0 10px ${scoreColor}80)`
            }}
          />
        </svg>

        {/* Center Content */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {safeScore}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
            / 100
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <span className={`badge badge-${safeRiskLevel.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
          {safeRiskLevel} RISK
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: riskColor }}>
          {safeRiskScore}%
        </span>
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Composite AI Quality Index</span>
    </div>
  );
}
