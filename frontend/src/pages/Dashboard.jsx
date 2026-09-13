import React, { useEffect, useState } from 'react';
import {
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Flame,
  PlusCircle,
  Upload,
  Github,
  History as HistoryIcon,
  Download,
  Eye,
  Activity,
  Sparkles,
  Cpu,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import Card3D from '../components/Card3D';
import HoloSphere3D from '../components/HoloSphere3D';
import { historyAPI, reviewAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard({ setActivePage, onViewReview }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await historyAPI.getHistory();
      if (res.data && res.data.reviews) {
        setHistory(res.data.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalReviews = history.length;
  const avgQuality = totalReviews > 0
    ? Math.round(history.reduce((acc, r) => acc + (r.overall_score || 0), 0) / totalReviews)
    : 0;
  const avgRisk = totalReviews > 0
    ? Math.round(history.reduce((acc, r) => acc + (r.risk_score || 0), 0) / totalReviews)
    : 0;
  const highRiskCount = history.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length;

  const chartData = [
    { name: 'Avg Score', val: avgQuality || 85, color: '#3b82f6' },
    { name: 'Avg Risk', val: avgRisk || 15, color: '#f59e0b' },
    { name: 'High Risk %', val: totalReviews > 0 ? Math.round((highRiskCount / totalReviews) * 100) : 0, color: '#ef4444' },
    { name: 'Confidence', val: 90, color: '#10b981' }
  ];

  return (
    <div>
      {/* 3D Hologram Hero Command Deck */}
      <Card3D maxRotation={6} style={{ marginBottom: '2rem' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.75rem 2rem',
            flexWrap: 'wrap',
            gap: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Cyber Ambient Glow in Card */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              right: '20%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* 3D WebGL Holographic Neural Sphere */}
            <HoloSphere3D size={110} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Radio size={12} className="pulse-icon" />
                  3D NEURAL CORE ACTIVE
                </span>
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                  5 AGENT CONSENSUS
                </span>
              </div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Autonomous AI Review Command Deck
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem', maxWidth: '580px' }}>
                Multi-dimensional static security audits, predictive regression modeling & real-time Groq consensus in an immersive 3D workspace.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setActivePage('review')}>
              <PlusCircle size={16} />
              Launch Review
            </button>
            <button className="btn btn-secondary" onClick={() => setActivePage('review')}>
              <Upload size={16} />
              Upload
            </button>
            <button className="btn btn-secondary" onClick={() => setActivePage('review')}>
              <Github size={16} />
              GitHub
            </button>
            <button className="btn btn-secondary" onClick={() => setActivePage('history')}>
              <HistoryIcon size={16} />
              History
            </button>
          </div>
        </div>
      </Card3D>

      {/* Metrics Row (Each MetricCard has 3D Tilt) */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard
          title="Total Reviews"
          value={totalReviews}
          sub="Analyzed across sessions"
          icon={FileCode}
          color="#3b82f6"
        />
        <MetricCard
          title="Avg Code Quality"
          value={`${avgQuality}/100`}
          sub="Composite score"
          icon={ShieldCheck}
          color="#10b981"
        />
        <MetricCard
          title="Average Risk"
          value={`${avgRisk}%`}
          sub="Predictive risk index"
          icon={AlertTriangle}
          color="#f59e0b"
        />
        <MetricCard
          title="High Risk Reviews"
          value={highRiskCount}
          sub="Critical / High risk alerts"
          icon={Flame}
          color="#ef4444"
        />
      </div>

      {/* Analytics & Quick Action Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card3D maxRotation={8}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#60a5fa" />
              System Performance Overview
            </h3>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card3D>

        <Card3D maxRotation={8}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} color="#c084fc" />
                Multi-Agent Neural Architecture
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Five specialized AI agents evaluate your code against industry security standards (CWE, OWASP) in parallel.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>??? Security:</span> Injection, Secrets, CWEs
                </div>
                <div style={{ padding: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>? Quality:</span> Halstead & Cyclomatic
                </div>
                <div style={{ padding: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 600 }}>? Performance:</span> Algorithmic Complexity
                </div>
                <div style={{ padding: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>?? Testing:</span> Unit Test Generation
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Consensus engine: <strong>Weighted Confidence 90%</strong>
              </span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setActivePage('review')}
              >
                Start Multi-Agent Scan ?
              </button>
            </div>
          </div>
        </Card3D>
      </div>

      {/* Recent Reviews Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Recent Review Stream</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest scans conducted by this account</p>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setActivePage('history')}>
            View Full History ?
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ margin: '0 auto 0.5rem' }} />
            Loading review history...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FileCode size={36} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, color: '#94a3b8' }}>No code reviews recorded yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Submit your first code snippet or file to begin.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Language</th>
                  <th>Source</th>
                  <th>Quality Score</th>
                  <th>Risk Level</th>
                  <th>Analyzed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>{rev.target_name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{rev.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                        {rev.language}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {rev.source_type}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: rev.overall_score >= 80 ? '#34d399' : rev.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                      }}>
                        {rev.overall_score}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${(rev.risk_level || 'LOW').toLowerCase()}`}>
                        {rev.risk_level}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {rev.created_at}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-icon"
                          title="Inspect Details"
                          onClick={() => onViewReview(rev.id)}
                        >
                          <Eye size={15} />
                        </button>
                        {rev.pdf_report_path && (
                          <a
                            className="btn-icon"
                            title="Download PDF"
                            href={reviewAPI.getReportUrl(rev.pdf_report_path.split(/[\/]/).pop())}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
