import React, { useState } from 'react';
import { Send, Mail, CheckCircle2, AlertCircle, X, ExternalLink, Copy } from 'lucide-react';
import { notifyAPI } from '../services/api';

export function WebhookModal({ isOpen, onClose, reviewId, reviewData }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setLoading(true);
    setError('');
    setStatus(null);
    try {
      const res = await notifyAPI.sendWebhook(reviewId, webhookUrl.trim());
      setStatus(res.data);
    } catch (err) {
      setError(err.message || 'Webhook dispatch failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '540px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="#3b82f6" />
            Dispatch Webhook / Slack Alert
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Send automated audit findings and metrics to your team Slack channel, Discord, or CI/CD webhook.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {status && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Webhook Dispatched Successfully! HTTP {status.http_status}</span>
            </div>
            <pre style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.5rem', overflowX: 'auto' }}>
              {JSON.stringify(status.payload_sent, null, 2)}
            </pre>
          </div>
        )}

        <form onSubmit={handleSend}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Webhook Endpoint URL
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://hooks.slack.com/services/... or https://myapi.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !webhookUrl.trim()}>
              {loading ? <span className="spinner" /> : 'Send Webhook Payload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EmailPreviewModal({ isOpen, onClose, reviewId }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await notifyAPI.getEmailPreview(reviewId, email.trim());
      setPreviewData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate email preview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '650px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={18} color="#ec4899" />
            Email Report Preview & Dispatch
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Generate a responsive HTML executive summary email for stakeholders and clients.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePreview} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="email"
            className="input-field"
            placeholder="recipient@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
            {loading ? <span className="spinner" /> : 'Generate Preview'}
          </button>
        </form>

        {previewData && (
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1rem', background: '#0b0f19' }}>
            {previewData.email_sent ? (
              <div style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} />
                <span>Email was dispatched to {previewData.recipient} via configured SMTP server!</span>
              </div>
            ) : (
              <div style={{ color: '#93c5fd', fontSize: '0.8rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>SMTP credentials not configured in backend .env ? previewing rendered HTML output below:</span>
              </div>
            )}

            <div dangerouslySetInnerHTML={{ __html: previewData.preview_html }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
