import React, { useState } from 'react';
import { GitBranch, Github, AlertTriangle } from 'lucide-react';

export default function GithubSection({ onReview, loading }) {
  const [repoUrl, setRepoUrl] = useState('https://github.com/octocat/Hello-World');
  const [branch, setBranch] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    onReview({ repo_url: repoUrl.trim(), branch: branch.trim() || null }, 'github');
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>
        Section 3: Review GitHub Repository
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Clone and inspect full public GitHub repositories. The system will recursively scan all supported source files.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">GitHub Repository URL</label>
          <div style={{ position: 'relative' }}>
            <input
              type="url"
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              required
            />
            <Github size={18} color="#9ca3af" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Branch (Optional)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. main, master, dev"
            />
            <GitBranch size={18} color="#9ca3af" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!repoUrl.trim() || loading}>
          {loading ? 'Cloning & Reviewing Repository...' : 'Clone & Review Repository'}
        </button>
      </form>
    </div>
  );
}
