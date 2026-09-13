import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { ShieldAlert } from 'lucide-react';

export default function RadarMetricsChart({ scores = {}, predictions = {} }) {
  const radarData = [
    { subject: 'Security', score: scores.security || 0, fullMark: 100 },
    { subject: 'Quality', score: scores.code_quality || 0, fullMark: 100 },
    { subject: 'Performance', score: scores.performance || 0, fullMark: 100 },
    { subject: 'Testing', score: scores.testing || 0, fullMark: 100 },
    { subject: 'Maintainability', score: scores.maintainability || 0, fullMark: 100 },
    { subject: 'Resilience', score: Math.max(0, 100 - (predictions.regression_risk || 0)), fullMark: 100 }
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <ShieldAlert size={18} color="#38bdf8" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
          Multi-Agent Dimension Radar
        </h3>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Holistic multi-dimensional evaluation covering security, complexity, throughput, and resilience.
      </p>

      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255, 255, 255, 0.15)" fontSize={9} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
            <Radar
              name="Agent Score"
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
