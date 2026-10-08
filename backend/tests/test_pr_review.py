import pytest
from app.processors.diff_processor import DiffProcessor
from app.processors.input_processor import InputProcessor
from app.services.static_analysis_service import StaticAnalysisService
from app.services.deduplication_service import FindingDeduplicationService
from app.services.impact_analysis_service import ImpactAnalysisService
from app.services.test_analysis_service import TestAnalysisService
from app.services.pr_comment_service import PRCommentService
from app.services.review_decision_service import ReviewDecisionService

SAMPLE_DIFF = """diff --git a/auth.py b/auth.py
index e69de29..4b825dc 100644
--- a/auth.py
+++ b/auth.py
@@ -1,5 +1,12 @@
 import os
+import sqlite3
 
 def login(user, pwd):
-    return True
+    conn = sqlite3.connect('users.db')
+    cursor = conn.cursor()
+    query = "SELECT * FROM users WHERE user = '" + user + "' AND pwd = '" + pwd + "'"
+    cursor.execute(query)
+    os.system("echo login attempt for " + user)
+    return cursor.fetchone()
"""

def test_diff_processor_parsing():
    assert DiffProcessor.is_unified_diff(SAMPLE_DIFF) is True
    res = DiffProcessor.parse_diff(SAMPLE_DIFF)
    assert res['source_type'] in ('diff', 'git_diff')
    assert res['total_files'] == 1
    assert res['total_lines'] > 0
    file_entry = res['files'][0]
    assert file_entry['filename'] == 'auth.py'
    assert len(file_entry['hunks']) == 1
    assert len(file_entry['added_lines']) > 0

def test_static_analysis_bandit_and_ruff():
    files = [{
        'filename': 'auth.py',
        'language': 'Python',
        'code': "import os\ndef login(user):\n    os.system(user)\n"
    }]
    res = StaticAnalysisService.run_all(files)
    assert 'findings' in res
    assert res['metrics']['bandit_issues_count'] >= 1
    assert any(f['source'] == 'Bandit' for f in res['findings'])

def test_finding_deduplication_and_confidence():
    raw_findings = [
        {
            'file': 'auth.py', 'line': 10, 'severity': 'HIGH',
            'title': 'SQL Injection Vulnerability', 'source': 'Security Agent',
            'description': 'Unescaped parameter', 'recommendation': 'Use parameterized queries'
        },
        {
            'file': 'auth.py', 'line': 10, 'severity': 'CRITICAL',
            'title': 'Possible SQL injection vector', 'source': 'Bandit',
            'description': 'Direct string concatenation in query', 'recommendation': 'Use placeholders'
        }
    ]
    deduped = FindingDeduplicationService.deduplicate_and_verify(raw_findings)
    assert len(deduped) == 1
    f = deduped[0]
    assert f['severity'] == 'CRITICAL'
    assert f['verified'] is True
    assert f['confidence'] >= 90
    assert 'Security Agent' in f['sources']
    assert 'Bandit' in f['sources']

def test_impact_analysis():
    diff_res = DiffProcessor.parse_diff(SAMPLE_DIFF)
    impact = ImpactAnalysisService.analyze_impact(
        files=diff_res['files'],
        diff_summary=diff_res['diff_summary'],
        findings=[{'severity': 'CRITICAL', 'file': 'auth.py', 'line': 7}]
    )
    assert 'risk_level' in impact
    assert impact['risk_level'] in ('CRITICAL', 'HIGH')
    assert len(impact['affected_components']) >= 1

def test_test_analysis():
    diff_res = DiffProcessor.parse_diff(SAMPLE_DIFF)
    tests = TestAnalysisService.analyze_tests(
        files=diff_res['files'],
        diff_summary=diff_res['diff_summary']
    )
    assert 'coverage_status' in tests
    assert tests['has_tests_included'] is False

def test_pr_comments_generation():
    diff_res = DiffProcessor.parse_diff(SAMPLE_DIFF)
    findings = [{
        'file': 'auth.py', 'line': 7, 'severity': 'HIGH',
        'issue': 'SQL Injection', 'explanation': 'Concatenated string',
        'suggested_fix': 'Use query params', 'confidence': 95, 'verified': True
    }]
    comments = PRCommentService.generate_comments(diff_res['files'], findings, diff_res['diff_summary'])
    assert len(comments) >= 1
    assert comments[0]['file'] == 'auth.py'
    assert comments[0]['line'] == 7

def test_review_decision_and_pr_summary():
    diff_res = DiffProcessor.parse_diff(SAMPLE_DIFF)
    findings = [{
        'file': 'auth.py', 'line': 7, 'severity': 'CRITICAL',
        'issue': 'Remote Code Execution', 'explanation': 'os.system(user)',
        'suggested_fix': 'Avoid shell call', 'confidence': 98, 'verified': True
    }]
    dec = ReviewDecisionService.evaluate_decision(
        findings=findings,
        files=diff_res['files'],
        diff_summary=diff_res['diff_summary'],
        test_analysis={'coverage_status': 'NO_TESTS_PRESENT'},
        impact_analysis={'risk_level': 'CRITICAL'},
        overall_score=45
    )
    assert dec['decision'] == 'REQUEST_CHANGES'
    assert 'pr_summary' in dec
    assert dec['pr_summary']['files_changed'] == 1
    assert dec['pr_summary']['markdown_summary'] != ''

def test_end_to_end_diff_review_execution():
    from app.database.database import SessionLocal
    from app.services.review_service import ReviewService
    db = SessionLocal()
    try:
        processed = InputProcessor.process_git_diff(SAMPLE_DIFF, target_name="auth_pr.diff")
        res = ReviewService.execute_review(db=db, processed_input=processed, user_id="test_pr_user")

        # 1. Diff analysis
        assert "diff_summary" in res
        # 2. File & Line level findings
        assert len(res["findings"]) > 0
        for f in res["findings"]:
            assert "file" in f
            assert "line" in f
            assert "severity" in f
            assert "issue" in f
            assert "explanation" in f
            assert "suggested_fix" in f
            # 8. Confidence & Verification
            assert "confidence" in f
            assert "verified" in f
        # 3. PR Review Comments
        assert "pr_comments" in res
        # 4. Change Impact Analysis
        assert "impact_analysis" in res
        # 5. Automated Test Analysis
        assert "test_analysis" in res
        # 6. Static Analysis
        assert "static_analysis" in res
        # 9. PR Summary
        assert "pr_summary" in res
        # 10. Review Decision
        assert "review_decision" in res
        assert res["review_decision"]["decision"] in ("APPROVE", "APPROVE_WITH_SUGGESTIONS", "REQUEST_CHANGES")
    finally:
        db.close()
