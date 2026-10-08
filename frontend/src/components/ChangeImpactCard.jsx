import React from 'react';
import {
  Layers,
  ShieldAlert,
  TestTube2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Database,
  Globe,
  Cpu
} from 'lucide-react';

export default function ChangeImpactCard({ impactAnalysis, testAnalysis }) {
  if (!impactAnalysis && !testAnalysis) return null;

  const impact = impactAnalysis || {};
  const tests = testAnalysis || {};

  const breakingRisk = impact.breaking_risk || 'LOW';
  const affectedComponents = impact.affected_components || [];
  const riskyModifications = impact.risky_modifications || [];
  const summary = impact.impact_summary || '';

  const coverageStatus = tests.coverage_status || 'ADEQUATE';
  const hasTests = tests.has_tests_included ?? false;
  const testFilesCount = tests.test_files_count || 0;
  const untestedFunctions = tests.untested_functions || [];
  const testRec = tests.recommendation || '';

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW':
      default: return '#10b981';
    }
  };

  const getSubsystemIcon = (name) => {
    const l = name.toLowerCase();
    if (l.includes('auth') || l.includes('identity')) return <Lock size={14} color="#f87171" />;
    if (l.includes('database') || l.includes('persistence')) return <Database size={14} color="#fbbf24" />;
    if (l.includes('api') || l.includes('route')) return <Globe size={14} color="#60a5fa" />;
    return <Cpu size={14} color="#a78bfa" />;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Column 1: Change Impact Analysis */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Layers size={18} color="#60a5fa" />
            Change Impact & Blast Radius
          </h3>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              background: `${getRiskColor(breakingRisk)}22`,
              color: getRiskColor(breakingRisk),
              border: `1px solid ${getRiskColor(breakingRisk)}44`
            }}
          >
            {breakingRisk} BREAKING RISK
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.45', marginBottom: '1rem' }}>
          {summary || 'Blast radius evaluation across application dependencies and architectural subsystems.'}
        </p>

        {/* Affected Subsystems */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
            Affected Architectural Subsystems ({affectedComponents.length})
          </span>
          {affectedComponents.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No high-risk subsystem boundary crossings detected.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {affectedComponents.map((c, i) => (
                <span
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#e2e8f0'
                  }}
                >
                  {getSubsystemIcon(c)}
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Risky Modifications */}
        {riskyModifications.length > 0 && (
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Specific High-Risk Changes
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {riskyModifications.slice(0, 3).map((rm, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '0.8rem',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    color: '#fde68a'
                  }}
                >
                  <strong style={{ color: '#fbbf24' }}>[{rm.area}] {rm.file}:</strong> {rm.warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Column 2: Automated Test Coverage Analysis */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <TestTube2 size={18} color="#06b6d4" />
            Automated Test Coverage Analysis
          </h3>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              background: coverageStatus === 'ADEQUATE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: coverageStatus === 'ADEQUATE' ? '#34d399' : '#f87171',
              border: `1px solid ${coverageStatus === 'ADEQUATE' ? '#10b981' : '#ef4444'}`
            }}
          >
            {coverageStatus === 'ADEQUATE' ? '✓ ADEQUATE COVERAGE' : '⚠ TESTS REQUIRED'}
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.45', marginBottom: '1rem' }}>
          {testRec || 'Verification that changes include matching test coverage and edge case assertions.'}
        </p>

        {/* Untested Functions List */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
            Untested Modified Functions ({untestedFunctions.length})
          </span>
          {untestedFunctions.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              All modified routines are paired with automated test specifications.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {untestedFunctions.slice(0, 4).map((uf, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px'
                  }}
                >
                  <code style={{ color: '#e2e8f0' }}>{uf.function}() in {uf.file}</code>
                  <span style={{ fontSize: '0.7rem', color: uf.risk === 'HIGH' ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                    {uf.risk} RISK
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
          {testFilesCount > 0 ? `Found ${testFilesCount} dedicated test suite file(s) in review.` : 'No test suites (.test.* / test_*.py) were included in this changeset.'}
        </div>
      </div>
    </div>
  );
}
