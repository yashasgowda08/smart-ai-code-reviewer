# Smart AI Code Reviewer - Backend Service

FastAPI-powered multi-agent code analysis service with SQLite persistence, ReportLab PDF generation, and Groq LLM consensus integration.

## Setup
1. Create virtual environment: `python -m venv .venv`
2. Activate: `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Linux/macOS)
3. Install: `pip install -r requirements.txt`
4. Run: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload`

## Tests
Run `pytest ..\tests -v` to execute all unit and integration tests.
