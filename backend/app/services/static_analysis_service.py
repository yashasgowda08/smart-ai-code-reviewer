import os
import sys
import json
import tempfile
import subprocess
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class StaticAnalysisService:
    """
    Deterministic static analysis integration running:
    - Bandit (AST security scanning for Python)
    - Radon (Cyclomatic complexity and Maintainability Index)
    - Ruff (Fast AST linting)
    - Deterministic multi-language heuristics for JS, TS, Java, Go, etc.
    """

    @classmethod
    def run_all(cls, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        all_findings = []
        metrics = {
            "radon_cc": [],
            "radon_mi": {},
            "bandit_issues_count": 0,
            "ruff_issues_count": 0
        }

        py_files = [f for f in files if f.get("language") == "Python" and f.get("code", "").strip()]
        other_files = [f for f in files if f.get("language") != "Python" and f.get("code", "").strip()]

        # 1. High-Performance Batch Static Analysis for Python Files
        if py_files:
            if len(py_files) == 1:
                # Single file fast path
                pf = py_files[0]
                code_text = pf.get("code", "")
                fname = pf.get("filename", "code.py")

                b_res = cls._run_bandit(code_text, fname)
                all_findings.extend(b_res)
                metrics["bandit_issues_count"] += len(b_res)

                r_cc, r_mi = cls._run_radon(code_text, fname)
                all_findings.extend(r_cc)
                metrics["radon_cc"].extend(r_cc)
                if r_mi: metrics["radon_mi"][fname] = r_mi

                rf_res = cls._run_ruff(code_text, fname)
                all_findings.extend(rf_res)
                metrics["ruff_issues_count"] += len(rf_res)
            else:
                # Multi-file batch execution (single subprocess for Bandit & Ruff across whole repo)
                b_findings, rf_findings = cls._run_batch_python(py_files)
                all_findings.extend(b_findings)
                all_findings.extend(rf_findings)
                metrics["bandit_issues_count"] += len(b_findings)
                metrics["ruff_issues_count"] += len(rf_findings)

                # In-memory Radon CC & MI per file
                for pf in py_files:
                    code_text = pf.get("code", "")
                    fname = pf.get("filename", "code.py")
                    r_cc, r_mi = cls._run_radon(code_text, fname)
                    all_findings.extend(r_cc)
                    metrics["radon_cc"].extend(r_cc)
                    if r_mi: metrics["radon_mi"][fname] = r_mi

        # 2. Multi-Language Deterministic Analysis for Other Files
        for f in other_files:
            fname = f.get("filename", "code.txt")
            lang = f.get("language", "Generic")
            code_text = f.get("code", "")
            generic_res = cls._run_generic_deterministic(code_text, fname, lang)
            all_findings.extend(generic_res)

        return {
            "findings": all_findings,
            "metrics": metrics
        }

    @classmethod
    def _run_batch_python(cls, py_files: List[Dict[str, Any]]) -> tuple:
        bandit_findings = []
        ruff_findings = []

        with tempfile.TemporaryDirectory(prefix="batch_py_review_") as temp_dir:
            name_map = {}
            for idx, pf in enumerate(py_files):
                clean_base = os.path.basename(pf.get("filename", f"file_{idx}.py"))
                safe_name = f"mod_{idx}_{clean_base}"
                name_map[safe_name] = pf.get("filename", clean_base)
                try:
                    with open(os.path.join(temp_dir, safe_name), "w", encoding="utf-8") as tf:
                        tf.write(pf.get("code", ""))
                except Exception:
                    pass

            # 1. Single Bandit Process for Entire Project
            bandit_exe = os.path.join(sys.prefix, "Scripts", "bandit.exe")
            if not os.path.exists(bandit_exe): bandit_exe = "bandit"
            try:
                proc = subprocess.run(
                    [bandit_exe, "-f", "json", "-q", "-r", temp_dir],
                    capture_output=True, text=True, timeout=25
                )
                if proc.stdout:
                    data = json.loads(proc.stdout)
                    for issue in data.get("results", []):
                        raw_fn = os.path.basename(issue.get("filename", ""))
                        orig_fn = name_map.get(raw_fn, raw_fn)
                        test_id = issue.get("test_id", "B000")
                        test_name = issue.get("test_name", "Security Issue")
                        issue_text = issue.get("issue_text", "")
                        raw_sev = (issue.get("issue_severity") or "MEDIUM").upper()
                        raw_conf = (issue.get("issue_confidence") or "HIGH").upper()
                        line_no = issue.get("line_number") or 1
                        cwe = issue.get("issue_cwe", {}).get("id")
                        cwe_str = f"CWE-{cwe}" if cwe else cls._map_bandit_cwe(test_id)
                        conf_score = 95 if raw_conf == "HIGH" else 85 if raw_conf == "MEDIUM" else 75
                        sev_mapped = "CRITICAL" if raw_sev == "HIGH" and test_id in ("B602", "B608", "B102", "B105", "B301") else raw_sev

                        bandit_findings.append({
                            "id": f"BANDIT-{test_id}",
                            "file": orig_fn,
                            "line": line_no,
                            "severity": sev_mapped,
                            "confidence": conf_score,
                            "issue": f"{test_name} ({test_id})",
                            "title": f"{test_name} ({test_id})",
                            "explanation": issue_text,
                            "description": issue_text,
                            "suggested_fix": cls._bandit_remediation(test_id, issue_text),
                            "recommendation": cls._bandit_remediation(test_id, issue_text),
                            "category": "Security",
                            "cwe": cwe_str,
                            "source": "Bandit",
                            "verified": True
                        })
            except Exception as e:
                logger.debug(f"Batch Bandit run skipped: {e}")

            # 2. Single Ruff Process for Entire Project
            ruff_exe = os.path.join(sys.prefix, "Scripts", "ruff.exe")
            if not os.path.exists(ruff_exe): ruff_exe = "ruff"
            try:
                proc_rf = subprocess.run(
                    [ruff_exe, "check", "--select=E,F,B,S", "--output-format=json", temp_dir],
                    capture_output=True, text=True, timeout=25
                )
                if proc_rf.stdout:
                    data_rf = json.loads(proc_rf.stdout)
                    for item in data_rf[:30]:
                        raw_fn = os.path.basename(item.get("filename", ""))
                        orig_fn = name_map.get(raw_fn, raw_fn)
                        rule_code = item.get("code", "RUFF")
                        msg = item.get("message", "Lint defect")
                        line_no = item.get("location", {}).get("row", 1)
                        sev = "HIGH" if rule_code.startswith("S") else "MEDIUM" if rule_code.startswith("B") else "LOW"

                        ruff_findings.append({
                            "id": f"RUFF-{rule_code}",
                            "file": orig_fn,
                            "line": line_no,
                            "severity": sev,
                            "confidence": 92,
                            "issue": f"Ruff: {msg} ({rule_code})",
                            "title": f"Ruff: {msg} ({rule_code})",
                            "explanation": f"AST lint rule {rule_code} flagged: {msg}.",
                            "description": f"AST lint rule {rule_code} flagged: {msg}.",
                            "suggested_fix": f"Resolve {rule_code} violation: {msg}.",
                            "recommendation": f"Resolve {rule_code} violation: {msg}.",
                            "category": "Code Quality" if not rule_code.startswith("S") else "Security",
                            "source": "Ruff",
                            "verified": True
                        })
            except Exception as e:
                logger.debug(f"Batch Ruff run skipped: {e}")

        return bandit_findings, ruff_findings

    @classmethod
    def _run_bandit(cls, code: str, filename: str) -> List[Dict[str, Any]]:
        findings = []
        tf_path = None
        try:
            with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as tf:
                tf.write(code)
                tf_path = tf.name

            bandit_exe = os.path.join(sys.prefix, "Scripts", "bandit.exe")
            if not os.path.exists(bandit_exe):
                bandit_exe = "bandit"

            proc = subprocess.run(
                [bandit_exe, "-f", "json", "-q", tf_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            if proc.stdout:
                data = json.loads(proc.stdout)
                for issue in data.get("results", []):
                    test_id = issue.get("test_id", "B000")
                    test_name = issue.get("test_name", "Security Issue")
                    issue_text = issue.get("issue_text", "")
                    raw_sev = (issue.get("issue_severity") or "MEDIUM").upper()
                    raw_conf = (issue.get("issue_confidence") or "HIGH").upper()
                    line_no = issue.get("line_number") or 1
                    cwe = issue.get("issue_cwe", {}).get("id")
                    cwe_str = f"CWE-{cwe}" if cwe else cls._map_bandit_cwe(test_id)

                    conf_score = 95 if raw_conf == "HIGH" else 85 if raw_conf == "MEDIUM" else 75
                    sev_mapped = "CRITICAL" if raw_sev == "HIGH" and test_id in ("B602", "B608", "B102", "B105", "B301") else raw_sev

                    findings.append({
                        "id": f"BANDIT-{test_id}",
                        "file": filename,
                        "line": line_no,
                        "severity": sev_mapped,
                        "confidence": conf_score,
                        "issue": f"{test_name} ({test_id})",
                        "title": f"{test_name} ({test_id})",
                        "explanation": issue_text,
                        "description": issue_text,
                        "suggested_fix": cls._bandit_remediation(test_id, issue_text),
                        "recommendation": cls._bandit_remediation(test_id, issue_text),
                        "category": "Security",
                        "cwe": cwe_str,
                        "source": "Bandit",
                        "verified": True
                    })
        except Exception as e:
            logger.debug(f"Bandit run skipped: {e}")
        finally:
            if tf_path and os.path.exists(tf_path):
                try:
                    os.remove(tf_path)
                except Exception:
                    pass
        return findings

    @classmethod
    def _run_radon(cls, code: str, filename: str) -> tuple:
        cc_findings = []
        mi_score = None
        try:
            import radon.complexity as cc
            import radon.metrics as rm

            blocks = cc.cc_visit(code)
            for b in blocks:
                # Flag high cyclomatic complexity (Rank C, D, E, F)
                if b.complexity > 10:
                    sev = "CRITICAL" if b.complexity >= 25 else "HIGH" if b.complexity >= 15 else "MEDIUM"
                    cc_findings.append({
                        "id": "RADON-CC",
                        "file": filename,
                        "line": b.lineno,
                        "severity": sev,
                        "confidence": 98,
                        "issue": f"High Cyclomatic Complexity ({b.name}(): CC={b.complexity})",
                        "title": f"High Cyclomatic Complexity ({b.name}(): CC={b.complexity})",
                        "explanation": f"Function '{b.name}' has a cyclomatic complexity of {b.complexity} (Rank {b.letter}). Complex branching increases defect probability and maintenance cost.",
                        "description": f"Function '{b.name}' has a cyclomatic complexity of {b.complexity} (Rank {b.letter}). Complex branching increases defect probability and maintenance cost.",
                        "suggested_fix": "Decompose into smaller single-responsibility helper functions and reduce nested conditions.",
                        "recommendation": "Decompose into smaller single-responsibility helper functions and reduce nested conditions.",
                        "category": "Code Quality",
                        "source": "Radon",
                        "verified": True
                    })

            mi_score = round(rm.mi_visit(code, multi=True), 1)
        except Exception as e:
            logger.debug(f"Radon run skipped: {e}")
        return cc_findings, mi_score

    @classmethod
    def _run_ruff(cls, code: str, filename: str) -> List[Dict[str, Any]]:
        findings = []
        tf_path = None
        try:
            with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as tf:
                tf.write(code)
                tf_path = tf.name

            ruff_exe = os.path.join(sys.prefix, "Scripts", "ruff.exe")
            if not os.path.exists(ruff_exe):
                ruff_exe = "ruff"

            proc = subprocess.run(
                [ruff_exe, "check", "--select=E,F,B,S", "--output-format=json", tf_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            if proc.stdout:
                data = json.loads(proc.stdout)
                for item in data[:8]:
                    rule_code = item.get("code", "RUFF")
                    msg = item.get("message", "")
                    row = item.get("location", {}).get("row", 1)

                    sev = "HIGH" if rule_code.startswith("S") or rule_code in ("F821", "E999") else "MEDIUM" if rule_code.startswith("B") else "LOW"

                    findings.append({
                        "id": f"RUFF-{rule_code}",
                        "file": filename,
                        "line": row,
                        "severity": sev,
                        "confidence": 95,
                        "issue": f"{rule_code}: {msg}",
                        "title": f"{rule_code}: {msg}",
                        "explanation": msg,
                        "description": msg,
                        "suggested_fix": f"Resolve rule {rule_code} in according with Python PEP best practices.",
                        "recommendation": f"Resolve rule {rule_code} in according with Python PEP best practices.",
                        "category": "Code Quality" if not rule_code.startswith("S") else "Security",
                        "source": "Ruff",
                        "verified": True
                    })
        except Exception as e:
            logger.debug(f"Ruff run skipped: {e}")
        finally:
            if tf_path and os.path.exists(tf_path):
                try:
                    os.remove(tf_path)
                except Exception:
                    pass
        return findings

    @classmethod
    def _run_generic_deterministic(cls, code: str, filename: str, lang: str) -> List[Dict[str, Any]]:
        import re
        findings = []
        lines = code.splitlines()

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*"):
                continue

            # Insecure eval in JS / TS / PHP / Ruby
            if re.search(r"\b(eval|Function)\s*\(", line):
                findings.append({
                    "id": "STATIC-EVAL",
                    "file": filename,
                    "line": idx,
                    "severity": "HIGH",
                    "confidence": 92,
                    "issue": "Unsafe Dynamic Code Execution (eval)",
                    "title": "Unsafe Dynamic Code Execution (eval)",
                    "explanation": "Dynamic code evaluation (eval / Function constructor) allows remote code execution if input contains untrusted data.",
                    "description": "Dynamic code evaluation allows remote code execution.",
                    "suggested_fix": "Refactor to use static JSON.parse or strict object mapping instead of eval.",
                    "recommendation": "Refactor to use static JSON.parse or strict object mapping instead of eval.",
                    "category": "Security",
                    "cwe": "CWE-95",
                    "source": "Deterministic Linter",
                    "verified": True
                })

            # Hardcoded API keys in any language
            if re.search(r"(?i)(password|secret|api_key|access_token|private_key)\s*[:=]\s*['\"][A-Za-z0-9_\-\.\@\#\$\%\^\&\*\!\~\/\+\=]{8,}['\"]", line):
                findings.append({
                    "id": "STATIC-SECRET",
                    "file": filename,
                    "line": idx,
                    "severity": "CRITICAL",
                    "confidence": 95,
                    "issue": "Hardcoded Secret / Credential",
                    "title": "Hardcoded Secret / Credential",
                    "explanation": "High-entropy secret or API credential detected in source code.",
                    "description": "Exposed credential in source code.",
                    "suggested_fix": "Extract secret into environment variables or secrets manager.",
                    "recommendation": "Extract secret into environment variables or secrets manager.",
                    "category": "Security",
                    "cwe": "CWE-798",
                    "source": "Deterministic Linter",
                    "verified": True
                })

        return findings

    @classmethod
    def _map_bandit_cwe(cls, test_id: str) -> str:
        mapping = {
            "B608": "CWE-89", "B605": "CWE-78", "B602": "CWE-78",
            "B102": "CWE-95", "B105": "CWE-798", "B106": "CWE-798",
            "B301": "CWE-502", "B501": "CWE-295", "B201": "CWE-1188"
        }
        return mapping.get(test_id, "CWE-699")

    @classmethod
    def _bandit_remediation(cls, test_id: str, issue_text: str) -> str:
        if "SQL" in issue_text or test_id == "B608":
            return "Use parameterized queries (e.g. cursor.execute(query, params)) or SQLAlchemy ORM query builder."
        if "shell" in issue_text or test_id in ("B602", "B605"):
            return "Pass command arguments as an array without shell=True to prevent command injection."
        if test_id in ("B105", "B106"):
            return "Move credentials into environment variables (os.getenv) or secrets manager."
        if test_id == "B301":
            return "Avoid pickle on untrusted data; use secure JSON or Protocol Buffers."
        return "Review and address deterministic security warning according to secure coding guidelines."
