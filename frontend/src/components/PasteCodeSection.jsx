import React, { useState } from 'react';
import { Code2, Play, Sparkles } from 'lucide-react';

const SAMPLE_SNIPPETS = {
  vulnerable_python: {
    filename: 'auth_handler.py',
    language: 'Python',
    code: `import os
import hashlib

API_SECRET = "AKIA1234567890123456"
admin_password = "supersecretpassword123"

def execute_user_query(query_str, table_name, param1, param2, param3, param4, param5, param6):
    # Potential SQL Injection
    sql = "SELECT * FROM " + table_name + " WHERE id = " + query_str
    
    # Command Injection
    os.system("echo " + query_str)
    
    # O(n^2) nested loop
    res = ""
    for i in range(1000):
        for j in range(1000):
            res += str(i * j)
            
    return res`
  },
  clean_algorithm: {
    filename: 'binary_search.py',
    language: 'Python',
    code: `from typing import List, Optional

def binary_search(arr: List[int], target: int) -> Optional[int]:
    """Perform logarithmic binary search on a sorted integer list."""
    if not arr:
        return None
        
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return None`
  },
  js_api: {
    filename: 'userController.js',
    language: 'JavaScript',
    code: `const db = require('../db');

async function getUserProfile(req, res) {
  try {
    const userId = req.params.id;
    // Missing input validation
    const query = "SELECT * FROM users WHERE id = '" + userId + "'";
    const user = await db.query(query);
    res.json(user);
  } catch (err) {
    // Empty catch smell
  }
}`
  }
};

export default function PasteCodeSection({ onReview, loading }) {
  const [code, setCode] = useState(SAMPLE_SNIPPETS.vulnerable_python.code);
  const [filename, setFilename] = useState(SAMPLE_SNIPPETS.vulnerable_python.filename);
  const [language, setLanguage] = useState(SAMPLE_SNIPPETS.vulnerable_python.language);

  const loadSample = (key) => {
    const sample = SAMPLE_SNIPPETS[key];
    if (sample) {
      setCode(sample.code);
      setFilename(sample.filename);
      setLanguage(sample.language);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    onReview({ code, filename, language }, 'paste');
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
          Section 2: Paste Source Code
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load Sample:</span>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => loadSample('vulnerable_python')}>
            Vulnerable Py
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => loadSample('clean_algorithm')}>
            Clean Py
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => loadSample('js_api')}>
            JS Flaws
          </button>
        </div>
      </div>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Paste code directly into the editor for instant static, predictive, and consensus analysis.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filename</label>
            <input
              type="text"
              className="form-input"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. app.py"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Programming Language</label>
            <select
              className="form-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="auto">Auto-Detect</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="C">C</option>
              <option value="C++">C++</option>
              <option value="C#">C#</option>
              <option value="Go">Go</option>
              <option value="PHP">PHP</option>
              <option value="HTML">HTML</option>
              <option value="CSS">CSS</option>
              <option value="SQL">SQL</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Source Code</label>
          <textarea
            className="form-textarea"
            rows={14}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your source code here..."
            style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.85rem', whiteSpace: 'pre' }}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!code.trim() || loading}>
          {loading ? 'Executing Multi-Agent Review...' : 'Run Multi-Agent Review'}
        </button>
      </form>
    </div>
  );
}
