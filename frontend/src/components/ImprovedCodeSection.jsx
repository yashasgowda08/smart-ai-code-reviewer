import React, { useState } from 'react';
import { Sparkles, Copy, Check, Download, ShieldCheck, Zap, Code2, ArrowRight } from 'lucide-react';
import Card3D from './Card3D';

export default function ImprovedCodeSection({ improvedCode, codeImprovements = [], language = 'Python', filename = 'improved_code.py' }) {
  const [copied, setCopied] = useState(false);

  if (!improvedCode) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(improvedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([improvedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = filename || 'improved_code.py';
    link.download = safeName.replace(/\.[^/.]+$/, '') + '_improved.' + (safeName.split('.').pop() || 'py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card3D depth={10}>
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(6, 78, 59, 0.25))',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.12)',
        borderRadius: '16px',
        padding: '1.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <Sparkles size={13} />
              AI Quality-Hardened Refactoring
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code2 size={22} color="#10b981" />
              Recommended Improved Code
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Production-ready implementation engineered to remediate identified risks and elevate code quality.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderColor: copied ? '#10b981' : 'rgba(255,255,255,0.2)',
                color: copied ? '#34d399' : '#fff',
                background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'
              }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Improved Code'}
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Download size={16} />
              Download File
            </button>
          </div>
        </div>

        {/* Enhancements Badges / Bullet Points */}
        {codeImprovements && codeImprovements.length > 0 && (
          <div style={{
            background: 'rgba(6, 78, 59, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={15} />
              Key Quality & Security Improvements Applied
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.4rem' }}>
              {codeImprovements.map((imp, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.825rem', color: '#e2e8f0' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>&bull;</span>
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monospace Code Display */}
        <div style={{
          background: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            background: '#0d131f',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '0.5rem' }}>{filename} (Hardened Refactor)</span>
            </div>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              {language}
            </span>
          </div>

          <pre style={{
            margin: 0,
            padding: '1.25rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            color: '#f8fafc',
            overflowX: 'auto',
            maxHeight: '440px'
          }}>
            <code>{improvedCode}</code>
          </pre>
        </div>

        {/* Actionable usage tip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginTop: '1rem',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <Zap size={14} color="#f59e0b" />
          <span>
            <b>Usage Tip:</b> You can replace your existing function or file with this refactored code directly to eliminate identified CWEs and pass CI/CD quality gates.
          </span>
        </div>
      </div>
    </Card3D>
  );
}
