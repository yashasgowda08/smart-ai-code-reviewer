import React, { useState } from 'react';
import { GitPullRequest, Upload, FileCode, CheckCircle2, AlertCircle, Sparkles, Trash2, ArrowRight } from 'lucide-react';

const SAMPLE_PR_DIFF = `diff --git a/backend/auth.py b/backend/auth.py
index e69de29..4b825dc 100644
--- a/backend/auth.py
+++ b/backend/auth.py
@@ -1,5 +1,18 @@
 import os
+import sqlite3
 
 def authenticate_user(username, password):
-    return False
+    # Connect to database and verify credentials
+    conn = sqlite3.connect('app.db')
+    cursor = conn.cursor()
+    # Dynamic SQL concatenation vulnerable to SQL injection
+    query = "SELECT id, role FROM users WHERE user = '" + username + "' AND pass = '" + password + "'"
+    cursor.execute(query)
+    user = cursor.fetchone()
+    if user:
+        os.system("echo Login success for user: " + username)
+    return user
+
+def reset_session(session_token):
+    pass
`;

export default function GitDiffSection({ onReview, loading }) {
  const [diffText, setDiffText] = useState('');
  const [targetName, setTargetName] = useState('PR #42: Feature Authentication Update');
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTargetName(file.name.replace(/\.(diff|patch)$/i, ''));
    const reader = new FileReader();
    reader.onload = (evt) => {
      setDiffText(evt.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setTargetName(file.name.replace(/\.(diff|patch)$/i, ''));
    const reader = new FileReader();
    reader.onload = (evt) => {
      setDiffText(evt.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!diffText.trim()) return;
    onReview({
      diff: diffText,
      target_name: targetName || 'pull_request.diff'
    }, 'diff');
  };

  // Quick stats extraction
  const lines = diffText.split('\n');
  const additions = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const deletions = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  const filesChanged = lines.filter(l => l.startsWith('diff --git') || (l.startsWith('--- ') && !l.includes('/dev/null'))).length || (diffText.trim() ? 1 : 0);

  return (
    <div className="card" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitPullRequest size={20} color="#3b82f6" />
            Git Diff & Pull Request Review
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Accepts any unified git diff, patch file, or changed files from <code>git diff</code>. Analyzes added, modified, and deleted lines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setDiffText(SAMPLE_PR_DIFF);
              setTargetName('PR #42: Feature Authentication Update');
            }}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={14} color="#f59e0b" />
            Load Sample PR Diff
          </button>
          {diffText && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDiffText('')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', color: '#ef4444' }}
              title="Clear diff content to input custom diff"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Pull Request Title / Target Branch
          </label>
          <input
            type="text"
            className="form-control"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="e.g. PR #108: Fix user authentication and query builder"
            required
            style={{ width: '100%', fontSize: '0.9rem' }}
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: dragOver ? '2px dashed #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            background: dragOver ? 'rgba(59, 130, 246, 0.05)' : '#090d16',
            padding: '0.75rem',
            marginBottom: '1rem',
            position: 'relative'
          }}
        >
          <textarea
            value={diffText}
            onChange={(e) => setDiffText(e.target.value)}
            placeholder={`Paste your unified git diff here... e.g.:

diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -10,3 +10,4 @@
 def process():
+    eval(user_input)

Or drag & drop a .diff / .patch file.`}
            rows={14}
            required
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: '1.45',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem', marginTop: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: '#93c5fd' }}>
              <Upload size={14} />
              Upload .diff / .patch file
              <input type="file" accept=".diff,.patch,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {diffText.trim() && (
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>{filesChanged} file(s)</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>+{additions}</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>-{deletions}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !diffText.trim()}
          style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          {loading ? (
            'Running PR Multi-Agent Inspection & Static Analysis...'
          ) : (
            <>
              <GitPullRequest size={17} />
              Analyze Pull Request Diff
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
