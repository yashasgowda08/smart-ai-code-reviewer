import os
import json
import logging
import httpx
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def get_api_key() -> Optional[str]:
        key = os.getenv("GROQ_API_KEY", "").strip()
        return key if key and key != "your_groq_api_key_here" else None

    @classmethod
    def review_code_with_groq(cls, files: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        api_key = cls.get_api_key()
        if not api_key:
            logger.info("GROQ_API_KEY not configured or empty. Using local multi-agent fallback.")
            return None

        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        # Prepare code representation (first 4000 characters to stay within token limits)
        code_snippets = []
        for f in files[:5]: # Max 5 files for prompt
            fname = f.get("filename", "code.txt")
            lang = f.get("language", "Generic")
            snippet = f.get("code", "")[:3000]
            code_snippets.append(f"--- File: {fname} ({lang}) ---\n{snippet}")
            
        combined_code = "\n\n".join(code_snippets)

        system_prompt = """You are an elite Senior Principal Software Architect and Security Auditor performing an automated code review.
Analyze the provided code and return ONLY a valid JSON object matching this exact schema:
{
    "quality_score": <int 0-100>,
    "security_score": <int 0-100>,
    "performance_score": <int 0-100>,
    "maintainability_score": <int 0-100>,
    "testing_score": <int 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "risk_score": <int 0-100>,
    "findings": [
        {
            "category": "<Security|Quality|Performance|Testing>",
            "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
            "file": "<filename>",
            "line": <int>,
            "description": "<brief description>",
            "recommendation": "<actionable fix>"
        }
    ],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"],
    "tests": ["<suggested test 1>", "<suggested test 2>"],
    "summary": "<2-3 sentence executive review summary>"
}
Ensure all scores are fair, explainable integers. Do not include markdown code block backticks if possible, return pure JSON."""

        user_prompt = f"Review the following source code files:\n\n{combined_code}"

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }

            with httpx.Client(timeout=25.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload
                )

            if response.status_code != 200:
                logger.warning(f"Groq API returned error status {response.status_code}: {response.text[:200]}")
                return None

            result_data = response.json()
            content = result_data["choices"][0]["message"]["content"]

            # Parse JSON
            cleaned = content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)

            # Validate / normalize keys
            q_score = int(parsed.get("quality_score", 85))
            s_score = int(parsed.get("security_score", 90))
            p_score = int(parsed.get("performance_score", 85))
            m_score = int(parsed.get("maintainability_score", 85))
            t_score = int(parsed.get("testing_score", 80))
            
            overall = int(s_score * 0.30 + q_score * 0.25 + p_score * 0.20 + t_score * 0.15 + m_score * 0.10)
            risk = int(parsed.get("risk_score", max(0, 100 - overall)))

            return {
                "overall_score": overall,
                "quality_score": q_score,
                "security_score": s_score,
                "performance_score": p_score,
                "maintainability_score": m_score,
                "testing_score": t_score,
                "risk_score": risk,
                "risk_level": parsed.get("risk_level", "LOW"),
                "findings": parsed.get("findings", []),
                "recommendations": parsed.get("recommendations", []),
                "tests": parsed.get("tests", []),
                "summary": parsed.get("summary", "External AI review completed successfully.")
            }

        except Exception as e:
            logger.warning(f"Failed to communicate with Groq AI: {str(e)}")
            return None