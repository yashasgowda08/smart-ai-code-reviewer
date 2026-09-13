import React from 'react';
import Card3D from './Card3D';

export default function MetricCard({ title, value, sub, icon: Icon, color = '#3b82f6' }) {
  return (
    <Card3D maxRotation={14} style={{ height: '100%' }}>
      <div className="metric-card" style={{ height: '100%' }}>
        <div className="metric-info">
          <span className="metric-title">{title}</span>
          <span className="metric-value">{value}</span>
          {sub && <span className="metric-sub">{sub}</span>}
        </div>
        <div className="metric-icon-wrap" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
    </Card3D>
  );
}
