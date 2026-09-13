import React from 'react';
import { CheckCircle, Lightbulb } from 'lucide-react';

export default function RecommendationsList({ recommendations = [] }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Lightbulb size={20} color="#fbbf24" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
          Actionable Engineering Recommendations
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700 }}>
              {idx + 1}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
              {rec}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
