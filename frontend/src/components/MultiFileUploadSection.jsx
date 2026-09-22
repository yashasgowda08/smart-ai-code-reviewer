import React, { useState } from 'react';
import { Files, Upload, Trash2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { reviewAPI } from '../services/api';

export default function MultiFileUploadSection({ onReviewResult, loading, setLoading }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await reviewAPI.uploadMultipleFiles(formData);
      if (res.data && res.data.data) {
        onReviewResult(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to review multiple files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Files size={20} color="#a855f7" />
        Multi-File Batch Review
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Upload multiple source files across 25+ languages & configs (.py, .js, .java, .ts, .go, .rs, .cpp, .cs, .rb, .php, .kt, .swift, .sh, .sql, .yaml, .json, Dockerfile, etc.) to run collective multi-agent project analysis.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div
        style={{
          border: '2px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          marginBottom: '1.25rem',
          cursor: 'pointer'
        }}
        onClick={() => document.getElementById('multiFileInput').click()}
      >
        <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
        <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
          Click or drag files here to add to batch
        </p>
        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
          Select multiple files simultaneously (any programming languages, scripts or configs)
        </p>
        <input
          id="multiFileInput"
          type="file"
          multiple
          accept="*/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#93c5fd' }}>
              Selected Files ({selectedFiles.length})
            </span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading || selectedFiles.length === 0}
        style={{ width: '100%' }}
      >
        {loading ? (
          <span className="spinner" />
        ) : (
          <>
            <ArrowRight size={16} />
            Analyze Batch ({selectedFiles.length} files)
          </>
        )}
      </button>
    </div>
  );
}
