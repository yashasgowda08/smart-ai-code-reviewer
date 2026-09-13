import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Sparkles, Trash2, FileCode, CheckCircle2 } from 'lucide-react';

const SAMPLES = {
  python: `import sqlite3
import os

def get_user_data(user_id):
    # Potential SQL Injection vulnerability
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchall()

def run_backup():
    # Command injection risk
    os.system("tar -czf backup.tar.gz /data")
`,
  javascript: `const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const query = req.query.q;
  // Reflected XSS vulnerability
  res.send('<h1>Search results for: ' + query + '</h1>');
});

function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
`,
  java: `import java.sql.*;

public class UserService {
    public ResultSet findUser(Connection conn, String username) throws SQLException {
        // SQL injection risk
        String sql = "SELECT * FROM accounts WHERE name = '" + username + "'";
        Statement stmt = conn.createStatement();
        return stmt.executeQuery(sql);
    }
}
`
};

export default function LiveEditorSection({ onReview, loading }) {
  const [language, setLanguage] = useState('python');
  const [filename, setFilename] = useState('main.py');
  const [code, setCode] = useState(SAMPLES.python);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (lang === 'python') {
      setFilename('main.py');
      setCode(SAMPLES.python);
    } else if (lang === 'javascript') {
      setFilename('server.js');
      setCode(SAMPLES.javascript);
    } else if (lang === 'java') {
      setFilename('UserService.java');
      setCode(SAMPLES.java);
    } else {
      setFilename(`code.${lang}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    onReview({ code, filename, language }, 'paste');
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCode size={20} color="#38bdf8" />
            Live In-Browser Code Editor
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Type or edit code directly in the browser with full Monaco syntax highlighting and run multi-agent review.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="input-field"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="sql">SQL</option>
            <option value="html">HTML</option>
          </select>

          <input
            type="text"
            className="input-field"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: '130px' }}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="filename"
          />

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => setCode('')}
            title="Clear Editor"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', overflow: 'hidden', height: '360px', marginBottom: '1rem' }}>
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          style={{ minWidth: '180px' }}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              <Play size={16} />
              Run Live AI Review
            </>
          )}
        </button>
      </div>
    </div>
  );
}
