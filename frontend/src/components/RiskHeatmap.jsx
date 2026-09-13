import React from 'react';
import { Flame, Shield, Activity, Cpu, TestTube } from 'lucide-react';

export default function RiskHeatmap({ findings = [] }) {
  const categories = ['Security', 'Code Quality', 'Performance', 'Testing & Resilience'];
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const matrix = {};
  categories.forEach(cat => {
    matrix[cat] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  });

  findings.forEach(f => {
    const cat = f.category || 'Security';
    const sev = f.severity || 'LOW';
    if (matrix[cat] && matrix[cat][sev] !== undefined) {
      matrix[cat][sev] += 1;
    } else {
      // Fuzzy fallback
      if (cat.includes('Security')) matrix['Security'][sev] = (matrix['Security'][sev] || 0) + 1;
      else if (cat.includes('Quality')) matrix['Code Quality'][sev] = (matrix['Code Quality'][sev] || 0) + 1;
      else if (cat.includes('Performance')) matrix['Performance'][sev] = (matrix['Performance'][sev] || 0) + 1;
      else if (matrix['Testing & Resilience']) matrix['Testing & Resilience'][sev] = (matrix['Testing & Resilience'][sev] || 0) + 1;
    }
  });

  const getHeatColor = (count, sev) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.02)';
    if (sev === 'CRITICAL') return `rgba(153, 27, 27, ${Math.min(0.9, 0.3 + count * 0.2)})`;
    if (sev === 'HIGH') return `rgba(239, 68, 68, ${Math.min(0.9, 0.25 + count * 0.2)})`;
    if (sev === 'MEDIUM') return `rgba(245, 158, 11, ${Math.min(0.9, 0.25 + count * 0.2)})`;
    return `rgba(16, 185, 129, ${Math.min(0.9, 0.25 + count * 0.2)})`;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Flame size={18} color="#f97316" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
          Defect Severity vs. Agent Category Matrix
        </h3>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Visual heatmap identifying concentrated defect risk zones across architectural layers.
      </p>

      <div className="custom-table-wrap">
        <table className="custom-table" style={{ textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Category</th>
              <th style={{ color: '#fca5a5' }}>Critical</th>
              <th style={{ color: '#f87171' }}>High</th>
              <th style={{ color: '#fbbf24' }}>Medium</th>
              <th style={{ color: '#34d399' }}>Low</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat}>
                <td style={{ textAlign: 'left', fontWeight: 600, color: '#e2e8f0' }}>{cat}</td>
                {severities.map((sev) => {
                  const count = matrix[cat]?.[sev] || 0;
                  return (
                    <td
                      key={sev}
                      style={{
                        backgroundColor: getHeatColor(count, sev),
                        fontWeight: count > 0 ? 700 : 400,
                        color: count > 0 ? '#fff' : '#64748b',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
