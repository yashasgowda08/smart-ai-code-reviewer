from typing import Dict, Any, Optional

class ConsensusEngine:
    @staticmethod
    def evaluate_consensus(
        local_score: int,
        local_risk: int,
        local_risk_level: str,
        groq_score: Optional[int],
        groq_risk: Optional[int],
        groq_risk_level: Optional[str]
    ) -> Dict[str, Any]:
        # Handle case where Groq AI is not available (offline / no API key)
        if groq_score is None:
            return {
                "status": "local_only",
                "local_analysis": {
                    "score": local_score,
                    "risk": local_risk,
                    "risk_level": local_risk_level
                },
                "external_ai_analysis": None,
                "comparison": {
                    "score_difference": 0,
                    "risk_difference": 0,
                    "agreement": "N/A",
                    "disagreement_detected": False
                },
                "confidence": 88,
                "confidence_level": "HIGH",
                "explanation": "Local multi-agent static analysis completed successfully. External Groq AI was offline or unconfigured."
            }

        score_diff = abs(local_score - groq_score)
        risk_diff = abs(local_risk - (groq_risk if groq_risk is not None else 0))

        # Agreement rules:
        # HIGH: score_diff <= 10 and risk_diff <= 15
        # MEDIUM: score_diff <= 20
        # LOW: otherwise
        if score_diff <= 10 and risk_diff <= 15:
            agreement = "HIGH"
            disagreement = False
            confidence = max(85, min(98, 100 - score_diff - int(risk_diff * 0.4)))
            confidence_level = "HIGH"
            explanation = "The multi-agent system and external AI show strong agreement across code quality, security, and risk profiles."
        elif score_diff <= 20:
            agreement = "MEDIUM"
            disagreement = False
            confidence = max(65, min(84, 88 - score_diff - int(risk_diff * 0.4)))
            confidence_level = "MEDIUM"
            explanation = "The local multi-agent system and external AI show moderate agreement with minor score variance."
        else:
            agreement = "LOW"
            disagreement = True
            confidence = max(40, min(64, 70 - score_diff))
            confidence_level = "LOW"
            explanation = "Noticeable divergence detected between local static analysis metrics and external LLM heuristics."

        return {
            "status": "completed",
            "local_analysis": {
                "score": local_score,
                "risk": local_risk,
                "risk_level": local_risk_level
            },
            "external_ai_analysis": {
                "score": groq_score,
                "risk": groq_risk,
                "risk_level": groq_risk_level or "LOW"
            },
            "comparison": {
                "score_difference": score_diff,
                "risk_difference": risk_diff,
                "agreement": agreement,
                "disagreement_detected": disagreement
            },
            "confidence": confidence,
            "confidence_level": confidence_level,
            "explanation": explanation
        }