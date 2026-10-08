import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldAlert,
  Flame,
  FileCode,
  ArrowUpRight
} from 'lucide-react';

export default function PRSummaryCard({ reviewDecision, prSummary, targetName }) {
  const [copied, setCopied] = useState(false);

  if (!reviewDecision && !prSummary) return null;

  const decision = reviewDecision?.decision || 'APPROVE_WITH_SUGGESTIONS';
  const label = reviewDecision?.label || 'Approve with suggestions';
  const icon = reviewDecision?.icon || '⚠️';
  const color = reviewDecision?.color || '#f59e0b';
  const reasons = reviewDecision?.reasons || [];
  const blockingIssues = reviewDecision?.blocking_issues || [];

  const summary = prSummary || reviewDecision?.pr_summary || {};
  const filesChanged = summary.files_changed ?? 1;
  const additions = summary.additions ?? 0;
  const deletions = summary.deletions ?? 0;
  const totalIssues = summary.total_issues ?? 0;
  const breakdown = summary.severity_breakdown || {};
  const qualityScore = summary.quality_score ?? 85;
  const overallRisk = summary.overall_risk ?? 20;
  const markdown = summary.markdown_summary || '';

  const handleCopyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isApproved = decision === 'APPROVE';
  const isRequestChanges = decision === 'REQUEST_CHANGES';

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.4rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 800,
    letterSpacing: '0.02em',
    background: isApproved
      ? 'rgba(16, 185, 129, 0.15)'
      : isRequestChanges
      ? 'rgba(239, 68, 68, 0.15)'
      : 'rgba(245, 158, 11, 0.15)',
    color: color,
    border: `1.5px solid ${color}`,
    boxShadow: `0 0 16px ${isApproved ? 'rgba(16, 185, 129, 0.25)' : isRequestChanges ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        borderLeft: `4px solid ${color}`,
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 30, 0.95) 100%)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={badgeStyle}>
            <span>{icon}</span>
            <span>{label.toUpperCase()}</span>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Pull Request Review Verdict
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCopyMarkdown}
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: copied ? '#10b981' : 'var(--border-color)',
            color: copied ? '#34d399' : '#cbd5e1'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Markdown Copied to Clipboard!' : 'Copy PR Review (Markdown)'}
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>FILES CHANGED</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9' }}>{filesChanged}</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>CHANGES</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            <span style={{ color: '#10b981' }}>+{additions}</span>{' '}
            <span style={{ color: '#ef4444' }}>-{deletions}</span>
          </span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>TOTAL ISSUES</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: totalIssues > 0 ? '#fbbf24' : '#34d399' }}>{totalIssues}</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>QUALITY SCORE</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: qualityScore >= 80 ? '#34d399' : qualityScore >= 60 ? '#fbbf24' : '#f87171' }}>
            {qualityScore}/100
          </span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>CRITICAL / HIGH</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: (breakdown.CRITICAL || breakdown.HIGH) ? '#ef4444' : '#10b981' }}>
            {breakdown.CRITICAL || 0} / {breakdown.HIGH || 0}
          </span>
        </div>
      </div>

      {/* Decision Rationale */}
      {reasons.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Decision Rationale
          </span>
          <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
            {reasons.map((r, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Blocking Issues Alert Box */}
      {blockingIssues.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginTop: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <ShieldAlert size={16} />
            Blocking Merge Requirements ({blockingIssues.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {blockingIssues.map((bi, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', display: 'flex', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>• [{bi.severity}] {bi.file}:{bi.line}</span>
                <span>— {bi.issue || bi.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
