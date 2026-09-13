import re
from typing import List, Dict, Any

class PerformanceAgent:
    @classmethod
    def analyze(cls, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        findings = []
        recommendations = []
        total_penalty = 0

        for f in files:
            filename = f.get("filename", "unknown")
            code = f.get("code", "")
            lines = code.splitlines()

            loop_stack = []
            for line_idx, line in enumerate(lines, start=1):
                indent = len(line) - len(line.lstrip())
                while loop_stack and loop_stack[-1]["indent"] >= indent and line.strip():
                    loop_stack.pop()

                if re.search(r'^\s*(for|while)\s*\(|^\s*for\s+[a-zA-Z0-9_,\s]+\s+in\s+|^\s*\w+\.forEach|^\s*\w+\.map\(', line):
                    loop_stack.append({"line": line_idx, "indent": indent, "snippet": line.strip()})
                    if len(loop_stack) >= 2:
                        depth = len(loop_stack)
                        complexity = "O(n^3)" if depth >= 3 else "O(n^2)"
                        findings.append({
                            "id": "PERF-001",
                            "category": "Performance",
                            "title": f"Nested Loop Detected ({complexity})",
                            "severity": "HIGH" if depth >= 3 else "MEDIUM",
                            "file": filename,
                            "line": line_idx,
                            "code_snippet": line.strip()[:100],
                            "description": f"Nested iteration at depth {depth} creates quadratic or polynomial complexity.",
                            "recommendation": "Use hash sets, dictionaries, or lookup maps to achieve O(1) lookups inside iterations."
                        })
                        total_penalty += (18 if depth >= 3 else 10)

                if loop_stack:
                    if re.search(r'(?i)(SELECT|query|session\.query|\.find\(|\.filter_by|db\.execute|\.get\(|fetch)', line):
                        findings.append({
                            "id": "PERF-002",
                            "category": "Performance",
                            "title": "N+1 Database Query in Loop",
                            "severity": "HIGH",
                            "file": filename,
                            "line": line_idx,
                            "code_snippet": line.strip()[:100],
                            "description": "Database query executed inside an iteration loop leads to N+1 query performance bottleneck.",
                            "recommendation": "Batch database queries using IN clauses or ORM eager loading (e.g. joinedload/selectinload)."
                        })
                        total_penalty += 15

                if loop_stack:
                    if re.search(r'(\w+)\s*\+=\s*["\']|\b(\w+)\s*=\s*\2\s*\+', line):
                        findings.append({
                            "id": "PERF-003",
                            "category": "Performance",
                            "title": "Repeated String Concatenation in Loop",
                            "severity": "LOW",
                            "file": filename,
                            "line": line_idx,
                            "code_snippet": line.strip()[:100],
                            "description": "Repeated string concatenation allocates new immutable string objects on each iteration.",
                            "recommendation": "Collect items in a list/array and use ''.join(items) or StringBuilder."
                        })
                        total_penalty += 5

                if loop_stack:
                    if re.search(r're\.(search|match|findall|sub)\(|RegExp\(', line):
                        findings.append({
                            "id": "PERF-004",
                            "category": "Performance",
                            "title": "Regex Re-Compilation in Loop",
                            "severity": "LOW",
                            "file": filename,
                            "line": line_idx,
                            "code_snippet": line.strip()[:100],
                            "description": "Regular expressions compiled repeatedly inside loops waste CPU cycles.",
                            "recommendation": "Pre-compile regex patterns once using re.compile() at module level."
                        })
                        total_penalty += 4

                if re.search(r'=\s*open\(', line) and not line.strip().startswith("with "):
                    findings.append({
                        "id": "PERF-005",
                        "category": "Performance",
                        "title": "Unclosed Resource / Missing Context Manager",
                        "severity": "MEDIUM",
                        "file": filename,
                        "line": line_idx,
                        "code_snippet": line.strip()[:100],
                        "description": "Opening file or socket without a 'with' context manager or try-finally may leak file descriptors.",
                        "recommendation": "Use 'with open(...) as f:' to ensure deterministic resource cleanup."
                    })
                    total_penalty += 8

        score = max(0, min(100, 100 - total_penalty))
        rec_set = []
        for f in findings:
            if f.get("recommendation") and f["recommendation"] not in rec_set:
                rec_set.append(f["recommendation"])

        return {
            "score": score,
            "findings": findings,
            "findings_count": len(findings),
            "recommendations": rec_set if rec_set else ["No major algorithmic bottlenecks detected."]
        }