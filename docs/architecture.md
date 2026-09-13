# System Architecture Document

## Overview
The Smart Multi-Agent AI Code Reviewer is structured around a decoupled service-oriented architecture:

### 1. Input Processing Pipeline (`app.processors.InputProcessor`)
- Normalizes incoming code from 3 sources: direct paste, multipart file/ZIP upload, and cloned GitHub repositories.
- Detects and parses 12 programming languages: Python, Java, JavaScript, TypeScript, C, C++, C#, Go, PHP, HTML, CSS, SQL.
- Filters out non-source directories (`.git`, `node_modules`, `venv`, `build`, etc.).

### 2. Multi-Agent Analysis Pipeline (`app.agents`)
- **SecurityAgent**: Scans for CWE vulnerabilities, injection patterns, hardcoded secrets, and unsafe execution routines.
- **QualityAgent**: Computes maintainability indices, cyclomatic branching complexity, naming conventions, and code smells.
- **PerformanceAgent**: Flags algorithmic bottlenecks ($O(n^2)$ loops), unclosed file descriptors, and N+1 query patterns.
- **TestingAgent**: Checks boundary validation and generates ready-to-run unit tests.
- **PredictionAgent**: Calculates deterministic risk indicators and future defect probability.

### 3. Consensus Engine (`app.utils.ConsensusEngine`)
- Compares local multi-agent scores against external Groq AI metrics.
- Evaluates score divergence and assigns confidence levels (High, Moderate, Divergence).

### 4. PDF Reporting Service (`app.services.PDFReportService`)
- Generates publication-ready PDF documents using ReportLab Platypus.
- Embeds high-resolution Matplotlib figures into document stream.

### 5. Persistent Storage (`app.database`)
- SQLAlchemy ORM with SQLite backend (`smart_reviewer.db`).
- Strict user-isolation ensuring private review histories.
