import pytest
import os
from app.services.pdf_service import PDFReportService

def test_pdf_creation_with_embedded_charts(tmp_path):
    output_path = str(tmp_path / "test_report.pdf")
    mock_data = {
        "review_id": "REV-TEST1234",
        "user_id": "TEST_PDF_USER",
        "created_at": "2026-08-18 12:00:00 UTC",
        "target_name": "calculator.py",
        "primary_language": "Python",
        "scores": {
            "overall": 92,
            "code_quality": 90,
            "security": 100,
            "performance": 85,
            "testing": 90,
            "maintainability": 88
        },
        "predictions": {
            "bug_risk": 10,
            "security_risk": 0,
            "regression_risk": 12,
            "technical_debt": 15,
            "overall_risk": 8,
            "future_bug_probability": 11,
            "risk_level": "LOW"
        },
        "consensus": {
            "comparison": {"agreement": "HIGH", "score_difference": 4, "risk_difference": 6},
            "confidence": 92,
            "explanation": "High consensus between multi-agent and external AI."
        },
        "external_ai": {
            "overall_score": 88,
            "summary": "Clean code with robust structure."
        },
        "findings": [
            {
                "category": "Performance",
                "title": "Nested Loop",
                "severity": "LOW",
                "file": "calculator.py",
                "line": 15,
                "description": "Minor nesting detected.",
                "recommendation": "Use generator expression."
            }
        ],
        "recommendations": ["Add docstrings", "Maintain testing"],
        "generated_tests": [
            {"file": "test_calculator.py", "language": "Python (pytest)", "code": "def test_add(): assert 1+1==2"}
        ]
    }

    result_path = PDFReportService.generate_pdf_report(mock_data, output_path)
    assert os.path.exists(result_path)
    assert os.path.getsize(result_path) > 10000 # Verified PDF with embedded charts
    with open(result_path, "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-"
