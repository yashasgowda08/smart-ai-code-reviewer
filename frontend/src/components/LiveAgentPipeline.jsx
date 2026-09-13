import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, Cpu, Activity, TestTube, Scale, CheckCircle2, Terminal } from 'lucide-react';

const AGENTS = [
  { id: 'input', name: 'Input Processor', desc: 'Tokenizing & normalizing AST syntax', color: '#60a5fa', icon: Cpu },
  { id: 'sec', name: 'Security Agent', desc: 'Scanning CWE-798, CWE-89, Injection vectors', color: '#10b981', icon: Shield },
  { id: 'qual', name: 'Code Quality Agent', desc: 'Computing cyclomatic complexity & code smells', color: '#38bdf8', icon: Activity },
  { id: 'perf', name: 'Performance Agent', desc: 'Identifying O(n?) bottlenecks & N+1 queries', color: '#a855f7', icon: Cpu },
  { id: 'test', name: 'Testing Agent', desc: 'Evaluating boundary resilience & test suite gen', color: '#06b6d4', icon: TestTube },
  { id: 'pred', name: 'Prediction Agent', desc: 'Predicting defect density & regression risk', color: '#f59e0b', icon: Sparkles },
  { id: 'cons', name: 'Consensus Engine', desc: 'Reconciling multi-agent scores with Groq AI', color: '#ec4899', icon: Scale },
];

const LOG_MESSAGES = [
  '[INPUT] Parsing source code and building AST syntax tree...',
  '[SECURITY] Scanning for hardcoded API keys and credentials (CWE-798)...',
  '[SECURITY] Checking for dynamic SQL string concatenation (CWE-89)...',
  '[SECURITY] Inspecting subprocess and system calls for command injection (CWE-78)...',
  '[QUALITY] Measuring cyclomatic complexity and control flow nesting depth...',
  '[QUALITY] Auditing function lengths, naming conventions, and parameter counts...',
  '[PERFORMANCE] Analyzing loop hierarchies for quadratic O(n?) patterns...',
  '[PERFORMANCE] Detecting database transactions inside iterations (N+1 queries)...',
  '[TESTING] Evaluating exception recovery and boundary condition checks...',
  '[TESTING] Synthesizing runnable automated unit test cases...',
  '[PREDICTION] Computing weighted risk model and future defect probability...',
  '[CONSENSUS] Dispatching payload to Groq LLM and calculating agreement delta...',
  '[PDF ENGINE] Compiling ReportLab PDF report with embedded high-res graphics...'
];

export default function LiveAgentPipeline({ active = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!active) return;
    let step = 0;
    const interval = setInterval(() => {
      if (step < AGENTS.length - 1) {
        step += 1;
        setCurrentStep(step);
      }
    }, 600);

    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < LOG_MESSAGES.length) {
        setLogs(prev => [...prev.slice(-5), LOG_MESSAGES[logIdx]]);
        logIdx += 1;
      }
    }, 350);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [active]);

  return (
    <div className="card live-pipeline-card" style={{ background: 'rgba(11, 15, 25, 0.95)', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="pulse-dot"></div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            Live Multi-Agent Neural Pipeline
          </h3>
        </div>
        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
          REAL-TIME TELEMETRY ACTIVE
        </span>
      </div>

      {/* Interactive Step Track */}
      <div className="pipeline-steps-grid">
        {AGENTS.map((agent, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          const Icon = agent.icon;

          return (
            <div
              key={agent.id}
              className={`pipeline-node ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
              style={{
                borderColor: isCurrent ? agent.color : isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                background: isCurrent ? `${agent.color}15` : isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                boxShadow: isCurrent ? `0 0 20px ${agent.color}40` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCurrent ? agent.color : isDone ? '#10b981' : '#334155',
                    color: '#fff'
                  }}
                >
                  {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isCurrent ? '#fff' : isDone ? '#d1fae5' : '#94a3b8' }}>
                  {agent.name}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: isCurrent ? '#cbd5e1' : 'var(--text-dim)', lineHeight: 1.3 }}>
                {agent.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Monospace Terminal Log Stream */}
      <div style={{ marginTop: '1.25rem', background: '#05070d', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.4rem' }}>
          <Terminal size={14} color="#60a5fa" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Agent Telemetry Stream</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minHeight: '80px', fontFamily: "'Fira Code', monospace", fontSize: '0.75rem' }}>
          {logs.map((msg, i) => (
            <div key={i} style={{ color: msg.includes('SECURITY') ? '#34d399' : msg.includes('QUALITY') ? '#38bdf8' : msg.includes('PERFORMANCE') ? '#c084fc' : msg.includes('PREDICTION') ? '#fbbf24' : '#93c5fd', opacity: i === logs.length - 1 ? 1 : 0.7 }}>
              <span style={{ color: '#64748b' }}>&gt;</span> {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
