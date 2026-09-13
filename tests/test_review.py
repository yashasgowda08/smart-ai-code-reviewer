import pytest
from app.processors.input_processor import InputProcessor
from app.agents.security_agent import SecurityAgent
from app.agents.quality_agent import QualityAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.testing_agent import TestingAgent
from app.agents.prediction_agent import PredictionAgent
from app.utils.scoring import ScoringCalculator
from app.utils.consensus import ConsensusEngine

def test_multi_agent_detection():
    sample_code = """import os
def dangerous_handler(user_input):
    api_key = "AKIA1111222233334444"
    os.system("rm -rf " + user_input)
    for i in range(10):
        for j in range(10):
            print(i, j)
"""
    proc = InputProcessor.process_pasted_code(sample_code, "danger.py", "Python")
    files = proc["files"]

    sec_res = SecurityAgent.analyze(files)
    assert sec_res["score"] < 70
    assert any(f["id"] in ("SEC-001", "SEC-002", "SEC-004") for f in sec_res["findings"])

    qual_res = QualityAgent.analyze(files)
    assert "score" in qual_res

    perf_res = PerformanceAgent.analyze(files)
    assert any("Nested Loop" in f["title"] for f in perf_res["findings"])

    test_res = TestingAgent.analyze(files)
    assert len(test_res["generated_tests"]) > 0

    pred_res = PredictionAgent.analyze(sec_res, qual_res, perf_res, test_res)
    assert pred_res["security_risk"] > 50

def test_consensus_calculation():
    # Test High Agreement
    high_res = ConsensusEngine.evaluate_consensus(
        local_score=90,
        local_risk=15,
        local_risk_level="LOW",
        groq_score=88,
        groq_risk=18,
        groq_risk_level="LOW"
    )
    assert high_res["comparison"]["agreement"] == "HIGH"
    assert high_res["confidence"] >= 80

    # Test Offline / Fallback
    offline_res = ConsensusEngine.evaluate_consensus(
        local_score=95,
        local_risk=10,
        local_risk_level="LOW",
        groq_score=None,
        groq_risk=None,
        groq_risk_level=None
    )
    assert offline_res["status"] == "local_only"
    assert offline_res["confidence"] > 70
