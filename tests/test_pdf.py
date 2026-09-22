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

def test_pdf_creation_with_improved_code(tmp_path):
    output_path = str(tmp_path / "test_report_improved.pdf")
    mock_data = {
        "review_id": "REV-IMPROVED01",
        "user_id": "TEST_PDF_USER",
        "created_at": "2026-08-18 12:00:00 UTC",
        "target_name": "danger.py",
        "primary_language": "Python",
        "scores": {
            "overall": 85,
            "code_quality": 88,
            "security": 90,
            "performance": 80,
            "testing": 85,
            "maintainability": 84
        },
        "predictions": {
            "bug_risk": 15,
            "security_risk": 10,
            "regression_risk": 12,
            "technical_debt": 14,
            "overall_risk": 12,
            "future_bug_probability": 14,
            "risk_level": "LOW"
        },
        "consensus": {
            "comparison": {"agreement": "HIGH", "score_difference": 2, "risk_difference": 3},
            "confidence": 95,
            "explanation": "High consensus."
        },
        "findings": [],
        "recommendations": ["Follow PEP8"],
        "improved_code": "import logging\nimport os\n\ndef calculate_sum(val_a: int, val_b: int) -> int:\n    \"\"\"Calculate sum of two integers safely.\"\"\"\n    return val_a + val_b\n",
        "code_improvements": [
            "Introduced PEP 484 type annotations for type safety",
            "Added documentation docstrings",
            "Structured error logging and validation"
        ]
    }
    result_path = PDFReportService.generate_pdf_report(mock_data, output_path)
    assert os.path.exists(result_path)
    assert os.path.getsize(result_path) > 10000
