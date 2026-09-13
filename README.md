# SMART MULTI-AGENT AI CODE REVIEWER
**Version: 2.0.0**

A production-grade, full-stack AI-powered multi-agent code review and predictive analysis system. It features five specialized local static analysis agents, external Groq AI integration with failover handling, a consensus and confidence calculation engine, SQLite persistence for user-isolated review history, automated ReportLab PDF generation with embedded charts, and a modern developer-tool React + Vite dashboard.

---

## Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Technology Stack](#technology-stack)
3. [Multi-Agent Analysis Engine](#multi-agent-analysis-engine)
4. [Consensus Engine](#consensus-engine)
5. [Project Structure](#project-structure)
6. [Prerequisites & Installation](#prerequisites--installation)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [API Documentation](#api-documentation)
10. [Automated Testing](#automated-testing)
11. [PDF Report Generation](#pdf-report-generation)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview & Architecture

The Smart Multi-Agent AI Code Reviewer coordinates five local deterministic static analysis agents alongside an external Groq LLM (e.g., Llama-3.3-70B) to deliver comprehensive security, quality, performance, resilience, and predictive defect metrics.

```
+-----------------------------------------------------------------------------------+
|                           REACT.JS + VITE FRONTEND                                |
|          (Developer Dashboard, 3 Review Modes, Interactive Charts & History)     |
+-----------------------------------------------------------------------------------+
                                      |  (REST API with X-User-ID)
                                      v
+-----------------------------------------------------------------------------------+
|                              FASTAPI BACKEND                                      |
|    +--------------------+  +--------------------+  +-------------------------+    |
|    | Auth & User Mgmt   |  | Input Processor    |  | SQLite & History Service|    |
|    +--------------------+  +--------------------+  +-------------------------+    |
|                                      |                                            |
|       +------------------------------+------------------------------+             |
|       |                                                             |             |
|       v                                                             v             |
|  +-------------------------------------+                +----------------------+  |
|  |     LOCAL MULTI-AGENT ENGINE        |                |   EXTERNAL GROQ AI   |  |
|  |  * Security Agent (CWEs, Secrets)   |                |   * Llama-3.3-70B    |  |
|  |  * Quality Agent (Complexity)       |                |   * Structured JSON  |  |
|  |  * Performance Agent (O(n?) loops)  |                |   * Failover Ready   |  |
|  |  * Testing Agent (Test Generator)   |                +----------------------+  |
|  |  * Prediction Agent (Defect Risk)   |                            |             |
|  +-------------------------------------+                            |             |
|       |                                                             |             |
|       +------------------------------+------------------------------+             |
|                                      |                                            |
|                                      v                                            |
|                       +-----------------------------+                             |
|                       |   CONSENSUS & CONFIDENCE    |                             |
|                       |   * Agreement Level (H/M/L) |                             |
|                       |   * Delta Calculation       |                             |
|                       +-----------------------------+                             |
|                                      |                                            |
|                   +------------------+------------------+                         |
|                   v                                     v                         |
|      +-------------------------+          +---------------------------+           |
|      |    SQLITE DATABASE      |          |    REPORTLAB PDF ENGINE   |           |
|      |  (User-Isolated History)|          |   (Embedded Chart Images) |           |
|      +-------------------------+          +---------------------------+           |
+-----------------------------------------------------------------------------------+
```

---

## Technology Stack

- **Frontend**:
  - React 18, Vite
  - Recharts (Interactive Bar, Radar & Comparison Charts)
  - Lucide React (Modern Developer Icons)
  - Axios (Configured with `X-User-ID` interceptor)
  - Modern Dark Mode Developer Interface

- **Backend**:
  - Python 3.11+
  - FastAPI & Uvicorn
  - SQLAlchemy & SQLite (Persistent user & review storage)
  - ReportLab & Matplotlib (PDF reports with embedded high-resolution charts)
  - Pydantic v2 (Input validation & schema modeling)
  - Python AST & Static Analysis Tokenizers

- **AI & Consensus**:
  - 5 Local Deterministic Static Analyzers
  - External Groq AI Reviewer (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`)
  - Consensus & Confidence Mathematical Engine

---

## Multi-Agent Analysis Engine

1. **Security Agent**:
   - Detects hardcoded secrets, API tokens (AWS, GitHub, Slack), SQL injection patterns, OS command execution (`shell=True`, `os.system`), unsafe `eval`/`exec`, insecure deserialization (`pickle.loads`, `yaml.load`), weak hashing algorithms (MD5/SHA1), path traversal (`../`), and unverified SSL certificates.
   - Maps each flaw directly to standard Common Weakness Enumerations (CWE-798, CWE-89, CWE-78, etc.).

2. **Code Quality Agent**:
   - Evaluates cyclomatic complexity, deeply nested control flow (>4 levels), long functions (>45 lines), excessive argument lists (>5 params), magic numeric literals, commented-out dead code, bare/empty exception handlers, and missing docstrings.
   - Computes an overall Code Quality Score and Maintainability Index.

3. **Performance Agent**:
   - Pinpoints nested iterations causing $O(n^2)$ and $O(n^3)$ bottlenecks.
   - Detects N+1 database query patterns inside loops.
   - Identifies repeated immutable string concatenations and uncompiled regular expressions in hot loops.
   - Flags unclosed resources (missing `with open(...)` context managers).

4. **Testing & Resilience Agent**:
   - Assesses testability, boundary condition coverage, and defensive exception handling.
   - Generates executable unit test suites tailored to the target language (`pytest` for Python, `Jest` for JavaScript/TypeScript, `JUnit` for Java).

5. **Prediction Agent**:
   - Calculates explainable defect risk probabilities:
     $$\text{Overall Risk} = 0.35 \times \text{SecurityRisk} + 0.30 \times \text{BugRisk} + 0.20 \times \text{RegressionRisk} + 0.15 \times \text{TechDebt}$$
   - Classifies risk levels into `LOW` (<25%), `MEDIUM` (25-50%), `HIGH` (51-75%), and `CRITICAL` (>75%).
   - Estimates future defect probability based on defect density and test coverage deficit.

---

## Consensus Engine

The Consensus Engine reconciles local multi-agent findings against external Groq AI metrics:

- **Score Difference**: $|\text{Score}_{\text{local}} - \text{Score}_{\text{groq}}|$
- **Risk Difference**: $|\text{Risk}_{\text{local}} - \text{Risk}_{\text{groq}}|$
- **Agreement Categorization**:
  - **HIGH**: Score Diff $\le 10$ and Risk Diff $\le 15$
  - **MEDIUM**: Score Diff $\le 20$
  - **LOW**: Score Diff $> 20$
- **Offline / Local Fallback**: When `GROQ_API_KEY` is not provided or Groq is unreachable, the system automatically falls back to local static analysis and returns `status: "local_only"`.

---

## Project Structure

```
smart-ai-code-reviewer/
??? backend/
?   ??? app/
?   ?   ??? __init__.py
?   ?   ??? main.py                     # FastAPI app entrypoint & CORS config
?   ?   ??? api/
?   ?   ?   ??? auth.py                 # Registration & Login endpoints
?   ?   ?   ??? code_review.py          # Upload, Paste & PDF Report download
?   ?   ?   ??? repository.py           # Local directory scanning
?   ?   ?   ??? github.py               # GitHub cloning & analysis
?   ?   ?   ??? history.py              # User-isolated SQLite audit history
?   ?   ??? agents/
?   ?   ?   ??? security_agent.py       # Security & CWE vulnerability scanner
?   ?   ?   ??? quality_agent.py        # Complexity & code smell analyzer
?   ?   ?   ??? performance_agent.py    # Algorithmic bottleneck & loop analyzer
?   ?   ?   ??? testing_agent.py        # Coverage checker & unit test generator
?   ?   ?   ??? prediction_agent.py     # Defect probability & risk model
?   ?   ??? services/
?   ?   ?   ??? auth_service.py         # PBKDF2 password hashing & verification
?   ?   ?   ??? ai_service.py           # Groq API client with failover
?   ?   ?   ??? pdf_service.py          # ReportLab PDF with embedded Matplotlib charts
?   ?   ?   ??? history_service.py      # SQLite review history manager
?   ?   ?   ??? review_service.py       # Pipeline orchestrator
?   ?   ??? processors/
?   ?   ?   ??? input_processor.py      # 12-language detector & code normalizer
?   ?   ??? database/
?   ?   ?   ??? database.py             # SQLAlchemy engine & session maker
?   ?   ?   ??? models.py               # User and Review ORM models
?   ?   ??? utils/
?   ?       ??? scoring.py              # Deterministic scoring algorithms
?   ?       ??? consensus.py            # Consensus & confidence evaluator
?   ??? reports/                        # Auto-generated PDF reports
?   ??? requirements.txt
?   ??? .env.example
?   ??? .env
?
??? frontend/
?   ??? src/
?   ?   ??? components/
?   ?   ?   ??? Navbar.jsx              # Navigation header with User ID & Logout
?   ?   ?   ??? MetricCard.jsx          # Metric cards
?   ?   ?   ??? FileUploadSection.jsx   # Drag & drop upload for 12 languages/ZIP
?   ?   ?   ??? PasteCodeSection.jsx    # Monospace code editor with preloaded samples
?   ?   ?   ??? GithubSection.jsx       # Public repository clone & scan
?   ?   ?   ??? FindingsTable.jsx       # Interactive findings table with severity filter
?   ?   ?   ??? RecommendationsList.jsx # Actionable checklist
?   ?   ?   ??? TestCasesView.jsx       # Generated unit test viewer with copy button
?   ?   ?   ??? ConsensusCard.jsx       # Consensus agreement & confidence meter
?   ?   ??? pages/
?   ?   ?   ??? Login.jsx               # User ID login
?   ?   ?   ??? Register.jsx            # User ID registration
?   ?   ?   ??? Dashboard.jsx           # Activity dashboard & metrics
?   ?   ?   ??? Review.jsx              # 3-section input & comprehensive report view
?   ?   ?   ??? History.jsx             # User-specific history & audit log
?   ?   ??? services/
?   ?   ?   ??? api.js                  # Axios client with interceptors
?   ?   ??? App.jsx
?   ?   ??? App.css
?   ?   ??? index.css
?   ?   ??? main.jsx
?   ??? index.html
?   ??? package.json
?   ??? vite.config.js
?
??? tests/
?   ??? conftest.py                     # In-memory test db & FastAPI client fixture
?   ??? test_auth.py                    # Auth & password hashing tests
?   ??? test_upload.py                  # File upload & validation tests
?   ??? test_review.py                  # Multi-agent analysis & consensus tests
?   ??? test_history.py                 # SQLite user isolation tests
?   ??? test_pdf.py                     # ReportLab PDF creation & embedded chart tests
?
??? docs/
?   ??? architecture.md
?   ??? api_reference.md
??? README.md
```

---

## Prerequisites & Installation

### 1. Prerequisites
- Python 3.10+ (Installed via `uv` or Python installer)
- Node.js 18+ and `npm`
- Git (Optional for GitHub repository review)

### 2. Backend Installation
```bash
cd backend
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\activate

# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Installation
```bash
cd frontend
npm install
```

---

## Environment Configuration

Create a `.env` file in the `backend/` directory (copied from `backend/.env.example`):

```env
PORT=8001
HOST=127.0.0.1
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=sqlite:///./smart_reviewer.db
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

> **Note**: `GROQ_API_KEY` is completely optional. If left blank, the application uses local multi-agent analysis with offline fallback.

---

## Running the Application

### 1. Start Backend Server
```bash
cd backend
# Windows:
.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# Linux/macOS:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
- **Backend URL**: `http://127.0.0.1:8001`
- **Interactive Swagger Docs**: `http://127.0.0.1:8001/docs`

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```
- **Frontend URL**: `http://localhost:5173`

---

## API Documentation

### Authentication
- `POST /auth/register`: Register user with `user_id`, `password`, `confirm_password`.
- `POST /auth/login`: Authenticate with `user_id` and `password`.

### Code Review
- `POST /code-review/analyze`: Submit pasted code snippet `{ code, filename, language }`.
- `POST /code-review/upload`: Multipart file upload (single file or ZIP).
- `GET /code-review/report/{report_name}`: Download generated PDF report.

### Repositories & GitHub
- `POST /repository/read`: Inspect local filesystem directory.
- `POST /github/clone`: Clone and inspect public repository files.
- `POST /github/review`: Clone and run full multi-agent review on a repository.

### Audit History
- `GET /history`: Retrieve user-specific reviews (requires `X-User-ID` header).
- `GET /history/{review_id}`: Retrieve single review details.
- `DELETE /history/{review_id}`: Delete a specific review.
- `DELETE /history`: Clear all reviews for the current user.

---

## Automated Testing

Run the full automated test suite using `pytest`:

```bash
cd backend
.venv\Scripts\pytest ..\tests -v
```

Test coverage includes:
- Authentication & password mismatch prevention
- Duplicate user detection
- Multi-agent CWE detection & algorithmic scoring
- Offline consensus calculation
- ReportLab PDF generation with embedded binary checks
- User-specific history isolation

---

## PDF Report Generation

Every review automatically produces a ReportLab PDF saved to `backend/reports/`. The report embeds:
1. Agent Performance Bar Chart
2. Predictive Risk Breakdown Chart
3. Local vs. Groq Consensus Chart
4. Agent Score Matrix Table
5. Detailed Findings with CWE numbers and line locations
6. Actionable Engineering Checklist
7. Generated Unit Test Code Blocks
8. Executive Conclusion
