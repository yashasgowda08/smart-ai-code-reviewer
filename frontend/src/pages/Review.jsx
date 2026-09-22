import React, { useState } from 'react';
import {
  Upload,
  Code2,
  Github,
  Download,
  RotateCcw,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bug,
  Activity,
  Layers,
  Sparkles,
  Eye,
  Sliders,
  FileCode,
  Globe,
  Files,
  Box,
  FileText,
  FileSpreadsheet,
  Send,
  Mail
} from 'lucide-react';
import FileUploadSection from '../components/FileUploadSection';
import PasteCodeSection from '../components/PasteCodeSection';
import GithubSection from '../components/GithubSection';
import LiveEditorSection from '../components/LiveEditorSection';
import UrlFetchSection from '../components/UrlFetchSection';
import MultiFileUploadSection from '../components/MultiFileUploadSection';
import DependencyScanSection from '../components/DependencyScanSection';
import { WebhookModal, EmailPreviewModal } from '../components/OutputModals';
import FindingsTable from '../components/FindingsTable';
import RecommendationsList from '../components/RecommendationsList';
import TestCasesView from '../components/TestCasesView';
import ConsensusCard from '../components/ConsensusCard';
import LiveAgentPipeline from '../components/LiveAgentPipeline';
import LiveScoreGauge from '../components/LiveScoreGauge';
import RadarMetricsChart from '../components/RadarMetricsChart';
import RiskHeatmap from '../components/RiskHeatmap';
import CodeViewerAnnotated from '../components/CodeViewerAnnotated';
import ImprovedCodeSection from '../components/ImprovedCodeSection';
import { reviewAPI, githubAPI, exportsAPI } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

export default function Review({ reviewResult, setReviewResult }) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'paste' | 'upload' | 'multi_upload' | 'url_fetch' | 'dependencies' | 'github'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmittedCode, setLastSubmittedCode] = useState('');
  const [lastFilename, setLastFilename] = useState('code.py');
  const [lastLang, setLastLang] = useState('Python');
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  // Modals for output
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [exporting, setExporting] = useState('');

  const handleReview = async (payload, type) => {
    setLoading(true);
    setError('');
    setReviewResult(null);

    if (type === 'paste') {
      setLastSubmittedCode(payload.code);
      setLastFilename(payload.filename);
      setLastLang(payload.language);
    }

    try {
      let res;
      if (type === 'paste') {
        res = await reviewAPI.analyzeCode(payload.code, payload.filename, payload.language);
      } else if (type === 'upload') {
        res = await reviewAPI.uploadFile(payload);
      } else if (type === 'multi_upload') {
        res = await reviewAPI.uploadMultipleFiles(payload);
      } else if (type === 'github') {
        res = await githubAPI.review(payload.repo_url, payload.branch);
      }

      if (res && res.data && res.data.data) {
        setReviewResult(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Code review analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = async () => {
    if (!reviewResult?.review_id) return;
    setExporting('json');
    try {
      await exportsAPI.downloadJson(reviewResult.review_id);
    } catch (err) {
      alert(err.message || 'Failed to download JSON export.');
    } finally {
      setExporting('');
    }
  };

  const handleExportCsv = async () => {
    if (!reviewResult?.review_id) return;
    setExporting('csv');
    try {
      await exportsAPI.downloadCsv(reviewResult.review_id);
    } catch (err) {
      alert(err.message || 'Failed to download CSV export.');
    } finally {
      setExporting('');
    }
  };

  const resetReview = () => {
    setReviewResult(null);
    setError('');
    setSelectedFileIdx(0);
  };

  const scores = reviewResult?.scores || {};
  const pred = reviewResult?.predictions || {};
  const externalAi = reviewResult?.external_ai;
  const findings = Array.isArray(reviewResult?.findings) ? reviewResult.findings : [];
  const displayFiles = Array.isArray(reviewResult?.files) ? reviewResult.files : [];
  const currentFile = displayFiles[selectedFileIdx] || (lastSubmittedCode ? {
    code: lastSubmittedCode,
    filename: lastFilename,
    language: lastLang
  } : (displayFiles[0] || null));

  const agentChartData = [
    { name: 'Security', score: scores.security || 0, fill: '#10b981' },
    { name: 'Quality', score: scores.code_quality || 0, fill: '#3b82f6' },
    { name: 'Performance', score: scores.performance || 0, fill: '#8b5cf6' },
    { name: 'Testing', score: scores.testing || 0, fill: '#06b6d4' },
    { name: 'Maintainability', score: scores.maintainability || 0, fill: '#6366f1' }
  ];

  const comparisonChartData = [
    { name: 'Overall Score', Local: scores.overall || 0, GroqAI: externalAi?.overall_score ?? 0 },
    { name: 'Risk %', Local: pred.overall_risk || 0, GroqAI: externalAi?.risk_score ?? 0 }
  ];

  return (
    <div>
      {!reviewResult ? (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Multi-Input & Multi-Output Code Review Engine
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Support for Live Editor, Multi-File Batch, URL Fetching, Dependency Auditing, plus JSON/CSV/PDF/Webhook exports.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="tabs-nav" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <FileCode size={16} />
              Live Code Editor
            </button>
            <button
              className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
              onClick={() => setActiveTab('paste')}
            >
              <Code2 size={16} />
              Paste Snippet
            </button>
            <button
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} />
              Single / ZIP File
            </button>
            <button
              className={`tab-btn ${activeTab === 'multi_upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('multi_upload')}
            >
              <Files size={16} />
              Multi-File Batch
            </button>
            <button
              className={`tab-btn ${activeTab === 'url_fetch' ? 'active' : ''}`}
              onClick={() => setActiveTab('url_fetch')}
            >
              <Globe size={16} />
              Fetch from URL
            </button>
            <button
              className={`tab-btn ${activeTab === 'dependencies' ? 'active' : ''}`}
              onClick={() => setActiveTab('dependencies')}
            >
              <Box size={16} />
              Dependency Scanner
            </button>
            <button
              className={`tab-btn ${activeTab === 'github' ? 'active' : ''}`}
              onClick={() => setActiveTab('github')}
            >
              <Github size={16} />
              GitHub Repository
            </button>
          </div>

          {/* Live Agent Neural Pipeline Graphic */}
          {loading && (
            <div style={{ marginBottom: '2rem' }}>
              <LiveAgentPipeline active={loading} />
            </div>
          )}

          {!loading && (
            <div>
              {activeTab === 'editor' && (
                <LiveEditorSection onReview={handleReview} loading={loading} />
              )}
              {activeTab === 'paste' && (
                <PasteCodeSection onReview={handleReview} loading={loading} />
              )}
              {activeTab === 'upload' && (
                <FileUploadSection onReview={handleReview} loading={loading} />
              )}
              {activeTab === 'multi_upload' && (
                <MultiFileUploadSection
                  onReview={handleReview}
                  onReviewResult={(data) => setReviewResult(data)}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
              {activeTab === 'url_fetch' && (
                <UrlFetchSection
                  onReviewResult={(data) => setReviewResult(data)}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
              {activeTab === 'dependencies' && (
                <DependencyScanSection />
              )}
              {activeTab === 'github' && (
                <GithubSection onReview={handleReview} loading={loading} />
              )}
            </div>
          )}
        </div>
      ) : (
        /* Report View with Extended Output Actions */
        <div>
          {/* Top Banner with 5 Output Channels */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span className="brand-badge">{reviewResult.review_id}</span>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                  {reviewResult.primary_language}
                </span>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }}>
                  {reviewResult.source_type?.toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                Review Report: {reviewResult.target_name}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Analyzed on {reviewResult.created_at} ? {reviewResult.total_files} file(s) ? {reviewResult.total_lines} lines
              </p>
            </div>

            {/* Output Actions Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={resetReview}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Upload size={15} />
                Upload Other Inputs / New Review
              </button>

              {/* Output 1: JSON */}
              <button
                className="btn btn-secondary"
                onClick={handleExportJson}
                disabled={Boolean(exporting)}
                title="Download complete structured analysis as JSON"
              >
                <FileText size={15} color="#38bdf8" />
                {exporting === 'json' ? 'Exporting...' : 'Export JSON'}
              </button>

              {/* Output 2: CSV */}
              <button
                className="btn btn-secondary"
                onClick={handleExportCsv}
                disabled={Boolean(exporting)}
                title="Download findings table as CSV spreadsheet"
              >
                <FileSpreadsheet size={15} color="#34d399" />
                {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
              </button>

              {/* Output 3: PDF */}
              {reviewResult.pdf_filename && (
                <a
                  className="btn btn-primary"
                  href={reviewAPI.getReportUrl(reviewResult.pdf_filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download executive PDF report"
                >
                  <Download size={15} />
                  PDF Report
                </a>
              )}

              {/* Output 4: Webhook / Slack */}
              <button
                className="btn btn-secondary"
                onClick={() => setIsWebhookModalOpen(true)}
                title="Send metrics to Slack / Webhook"
              >
                <Send size={15} color="#818cf8" />
                Webhook
              </button>

              {/* Output 5: Email Summary */}
              <button
                className="btn btn-secondary"
                onClick={() => setIsEmailModalOpen(true)}
                title="Preview & send executive email summary"
              >
                <Mail size={15} color="#ec4899" />
                Email
              </button>
            </div>
          </div>

          {/* Live Radial Gauge + Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <LiveScoreGauge
              score={scores.overall || 0}
              riskScore={pred.overall_risk || 0}
              riskLevel={pred.risk_level || 'LOW'}
            />

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SECURITY COMPLIANCE</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: scores.security >= 80 ? '#34d399' : '#f87171', margin: '0.2rem 0' }}>
                {scores.security}/100
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CWE vulnerability resistance</span>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>MAINTAINABILITY INDEX</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', margin: '0.2rem 0' }}>
                {scores.maintainability}/100
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Complexity & architectural longevity</span>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>FUTURE BUG PROB.</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a78bfa', margin: '0.2rem 0' }}>
                {pred.future_bug_probability}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Statistical regression estimate</span>
            </div>
          </div>

          {/* Graphics Row 1: Radar Dimension Chart + Risk Heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <RadarMetricsChart scores={scores} predictions={pred} />
            <RiskHeatmap findings={findings} />
          </div>

          {/* Graphics Row 2: Performance Bars + Local vs Groq Consensus Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#10b981" />
                Agent Performance Scores
              </h3>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {agentChartData.map((e, idx) => (
                        <Cell key={`cell-${idx}`} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card" style={{ minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#8b5cf6" />
                Local Multi-Agent vs. Groq AI Comparison
              </h3>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="Local" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="GroqAI" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Consensus Engine Detail */}
          <div style={{ marginBottom: '1.5rem' }}>
            <ConsensusCard consensus={reviewResult.consensus} localScore={scores.overall} groqAi={externalAi} />
          </div>

          {/* Live Annotated Code Scanner */}
          {currentFile && currentFile.code && (
            <div style={{ marginBottom: '1.5rem' }}>
              {displayFiles.length > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '0.4rem', fontWeight: 600 }}>
                    Select File to Inspect ({displayFiles.length}):
                  </span>
                  {displayFiles.map((df, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedFileIdx(i)}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        background: selectedFileIdx === i ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: selectedFileIdx === i ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                        color: selectedFileIdx === i ? '#93c5fd' : '#cbd5e1'
                      }}
                    >
                      {df.filename} ({df.language})
                    </button>
                  ))}
                </div>
              )}
              <CodeViewerAnnotated
                code={currentFile?.code || ''}
                findings={findings.filter((f) => {
                  if (!f || !f.file) return true;
                  if (!currentFile?.filename) return true;
                  const fFile = String(f.file).toLowerCase();
                  const curFile = String(currentFile.filename).toLowerCase();
                  return fFile === curFile || fFile.endsWith(curFile) || curFile.endsWith(fFile);
                })}
                filename={currentFile?.filename || 'code.py'}
                language={currentFile?.language || 'Code'}
              />
            </div>
          )}

          {/* Findings Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <FindingsTable findings={findings} />
          </div>

          {/* Improved & Better Refactored Code */}
          {reviewResult.improved_code && (
            <div style={{ marginBottom: '1.5rem' }}>
              <ImprovedCodeSection
                improvedCode={reviewResult.improved_code}
                codeImprovements={reviewResult.code_improvements || []}
                language={reviewResult.primary_language || lastLang}
                filename={reviewResult.target_name || lastFilename}
              />
            </div>
          )}

          {/* Recommendations & Generated Tests */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <RecommendationsList recommendations={reviewResult.recommendations || []} />
            <TestCasesView tests={reviewResult.generated_tests || []} />
          </div>

          {/* Output Modals */}
          <WebhookModal
            isOpen={isWebhookModalOpen}
            onClose={() => setIsWebhookModalOpen(false)}
            reviewId={reviewResult.review_id}
            reviewData={reviewResult}
          />

          <EmailPreviewModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            reviewId={reviewResult.review_id}
          />
        </div>
      )}
    </div>
  );
}
