from typing import Dict, Any

class PredictionAgent:
    @classmethod
    def analyze(cls, security_res: Dict[str, Any], quality_res: Dict[str, Any], perf_res: Dict[str, Any], test_res: Dict[str, Any]) -> Dict[str, Any]:
        sec_score = security_res.get("score", 100)
        qual_score = quality_res.get("score", 100)
        perf_score = perf_res.get("score", 100)
        test_score = test_res.get("score", 100)
        maintainability = quality_res.get("maintainability_score", 100)

        sec_findings = security_res.get("findings", [])
        crit_count = sum(1 for f in sec_findings if f.get("severity") == "CRITICAL")
        high_count = sum(1 for f in sec_findings if f.get("severity") == "HIGH")
        security_risk = min(100, int((100 - sec_score) * 0.9 + (crit_count * 20) + (high_count * 10)))

        bug_risk = min(100, int((100 - qual_score) * 0.5 + (100 - test_score) * 0.5))
        regression_risk = min(100, int((100 - test_score) * 0.6 + (100 - maintainability) * 0.4))
        technical_debt = min(100, int((100 - qual_score) * 0.6 + (100 - perf_score) * 0.4))

        overall_risk = min(100, max(0, int(
            security_risk * 0.35 +
            bug_risk * 0.30 +
            regression_risk * 0.20 +
            technical_debt * 0.15
        )))

        future_bug_prob = min(99, max(5, int(
            bug_risk * 0.5 + regression_risk * 0.3 + (100 - test_score) * 0.2
        )))

        if overall_risk <= 20:
            risk_level = "LOW"
        elif overall_risk <= 45:
            risk_level = "MEDIUM"
        elif overall_risk <= 75:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        return {
            "bug_risk": bug_risk,
            "security_risk": security_risk,
            "regression_risk": regression_risk,
            "technical_debt": technical_debt,
            "overall_risk": overall_risk,
            "future_bug_probability": future_bug_prob,
            "risk_level": risk_level
        }