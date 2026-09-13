import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FileUploadSection({ onReview, loading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    onReview(formData, 'upload');
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>
        Section 1: Upload Source Code File or Archive
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Supports 12 languages: Python (.py), Java (.java), JavaScript (.js), TypeScript (.ts), C/C++ (.c, .cpp), C# (.cs), Go (.go), PHP (.php), HTML, CSS, SQL, or .ZIP archive.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            border: `2px dashed ${dragActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '12px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(15, 23, 42, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.25rem'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleChange}
            accept=".py,.java,.js,.jsx,.ts,.tsx,.c,.h,.cpp,.hpp,.cs,.go,.php,.html,.css,.sql,.zip"
          />
          <UploadCloud size={44} color="#60a5fa" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 600, color: '#f3f4f6', marginBottom: '0.25rem' }}>
            {selectedFile ? selectedFile.name : 'Click to browse or drag and drop code file'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Maximum file size: 10MB'}
          </p>
        </div>

        {selectedFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.6rem 1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <File size={16} color="#60a5fa" />
            <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>Ready to analyze: <b>{selectedFile.name}</b></span>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!selectedFile || loading}>
          {loading ? 'Analyzing Code with 5 Agents...' : 'Run Multi-Agent Review'}
        </button>
      </form>
    </div>
  );
}
