from typing import List, Dict, Any

class FindingDeduplicationService:
    """
    Finding Deduplication & Multi-Source Verification Service.
    Merges duplicate findings across Static Analysis (Bandit/Radon/Ruff),
    Multi-Agent heuristics, and Groq LLM.
    Assigns confidence (0-100%) and verification badges.
    """

    @classmethod
    def deduplicate_and_verify(cls, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not findings:
            return []

        clusters: Dict[str, List[Dict[str, Any]]] = {}

        for f in findings:
            file_key = str(f.get("file", "unknown")).lower().replace("\\", "/")
            line_val = int(f.get("line") or 1)
            # Group into line buckets (+/- 2 lines)
            bucket = line_val // 3
            category = str(f.get("category", "General")).lower()
            cwe = str(f.get("cwe") or "").upper()
            norm_topic = cls._extract_topic_key(f)

            cluster_id = f"{file_key}:{bucket}:{norm_topic or category}"
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            clusters[cluster_id].append(f)

        merged_findings = []
        sev_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}

        for cluster_id, items in clusters.items():
            if len(items) == 1:
                item = items[0]
                cls._standardize_finding(item, verified=False, sources=[item.get("source", "Analyzer")])
                merged_findings.append(item)
                continue

            # Multiple sources flagged same issue -> MERGE & VERIFY
            primary = items[0]
            sources = list(set(it.get("source", "Analyzer") for it in items if it.get("source")))

            # Highest severity
            max_item = max(items, key=lambda x: sev_rank.get((x.get("severity") or "LOW").upper(), 1))
            highest_sev = max_item.get("severity", "MEDIUM")

            # Best title, explanation, remediation
            best_cwe = next((it.get("cwe") for it in items if it.get("cwe")), "")
            best_fix = next((it.get("suggested_fix") or it.get("recommendation") for it in items if it.get("suggested_fix") or it.get("recommendation")), "")
            best_explanation = next((it.get("explanation") or it.get("description") for it in items if len(it.get("explanation") or it.get("description") or "") > 20), items[0].get("description", ""))

            # Calculate confidence
            is_static = any(s in ("Bandit", "Radon", "Ruff", "Deterministic Linter") for s in sources)
            base_conf = 90 if is_static else 75
            conf = min(99, base_conf + (len(sources) - 1) * 6)

            merged = {
                "id": primary.get("id", "FND-001"),
                "file": primary.get("file", "unknown"),
                "line": primary.get("line", 1),
                "severity": highest_sev,
                "confidence": conf,
                "issue": max_item.get("issue") or max_item.get("title") or "Identified Defect",
                "title": max_item.get("issue") or max_item.get("title") or "Identified Defect",
                "explanation": best_explanation,
                "description": best_explanation,
                "suggested_fix": best_fix or "Apply recommended architectural hardening.",
                "recommendation": best_fix or "Apply recommended architectural hardening.",
                "category": primary.get("category", "Security"),
                "cwe": best_cwe,
                "source": ", ".join(sources),
                "sources": sources,
                "verified": True,
                "verification_badge": f"Verified ({len(sources)} analyzers)"
            }
            cls._standardize_finding(merged, verified=True, sources=sources)
            merged_findings.append(merged)

        # Sort: CRITICAL -> HIGH -> MEDIUM -> LOW, then line
        merged_findings.sort(key=lambda x: (-sev_rank.get(x["severity"], 0), x.get("line", 1)))
        return merged_findings

    @classmethod
    def _standardize_finding(cls, f: Dict[str, Any], verified: bool, sources: List[str]):
        # Ensure all 10 required keys exist
        f["severity"] = (f.get("severity") or "LOW").upper()
        if "confidence" not in f:
            f["confidence"] = 90 if f.get("source") in ("Bandit", "Radon", "Ruff") else 80
        f["issue"] = f.get("issue") or f.get("title") or "Defect"
        f["title"] = f["issue"]
        f["explanation"] = f.get("explanation") or f.get("description") or "Potential defect in implementation."
        f["description"] = f["explanation"]
        f["suggested_fix"] = f.get("suggested_fix") or f.get("recommendation") or "Review and refactor code."
        f["recommendation"] = f["suggested_fix"]
        f["verified"] = verified or f.get("verified", False)
        f["sources"] = sources

    @classmethod
    def _extract_topic_key(cls, f: Dict[str, Any]) -> str:
        text = f"{f.get('title', '')} {f.get('description', '')} {f.get('id', '')} {f.get('cwe', '')}".lower()
        if "sql" in text: return "sql_injection"
        if "command" in text or "shell" in text or "cwe-78" in text: return "command_injection"
        if "secret" in text or "password" in text or "cwe-798" in text: return "hardcoded_secret"
        if "eval" in text or "exec" in text or "cwe-95" in text: return "eval"
        if "complexity" in text: return "complexity"
        if "deserialize" in text or "pickle" in text: return "deserialization"
        if "xss" in text: return "xss"
        if "test" in text or "boundary" in text: return "testing"
        return ""
