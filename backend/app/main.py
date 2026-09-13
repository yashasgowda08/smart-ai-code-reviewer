import os
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .database.database import init_db
from .api import (
    auth_router, code_review_router, repository_router,
    github_router, history_router, admin_router,
    exports_router, notify_router, url_fetch_router
)

init_db()

app = FastAPI(
    title="Smart Multi-Agent AI Code Reviewer API",
    description="Production-grade AI-powered multi-agent code review, predictive analysis & consensus system.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(auth_router)
app.include_router(code_review_router)
app.include_router(repository_router)
app.include_router(github_router)
app.include_router(history_router)
app.include_router(admin_router)
app.include_router(exports_router)
app.include_router(notify_router)
app.include_router(url_fetch_router)

@app.get("/", tags=["System"])
def root():
    return {
        "name": "Smart Multi-Agent AI Code Reviewer",
        "version": "2.0.0",
        "status": "online",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "inputs": ["paste", "upload", "github", "url_fetch", "dependency_scan", "multi_file"],
        "outputs": ["pdf_report", "json_export", "csv_export", "webhook", "email_preview"]
    }

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "groq_configured": bool(os.getenv("GROQ_API_KEY", "").strip() and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here"),
        "admin_configured": bool(os.getenv("ADMIN_SECRET_KEY", "").strip()),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)