from typing import Dict, Any

class ScoringCalculator:
    @staticmethod
    def calculate_scores(
        security_score: int,
        quality_score: int,
        performance_score: int,
        testing_score: int,
        maintainability_score: int
    ) -> Dict[str, int]:
        # Weighted overall composite
        # Security: 30%, Quality: 25%, Performance: 20%, Testing: 15%, Maintainability: 10%
        overall = int(
            security_score * 0.30 +
            quality_score * 0.25 +
            performance_score * 0.20 +
            testing_score * 0.15 +
            maintainability_score * 0.10
        )
        overall = max(0, min(100, overall))

        return {
            "overall": overall,
            "code_quality": quality_score,
            "security": security_score,
            "performance": performance_score,
            "testing": testing_score,
            "maintainability": maintainability_score
        }