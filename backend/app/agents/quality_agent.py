import re
import ast
from typing import List, Dict, Any

class QualityAgent:
    POOR_VAR_NAMES = {"a", "b", "c", "d", "e", "f", "g", "x", "y", "z", "temp", "data", "foo", "bar", "baz", "tmp", "val", "test", "res"}

    @classmethod
    def analyze(cls, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        findings = []
        recommendations = []
        total_penalty = 0

        for f in files:
            filename = f.get("filename", "unknown")
            code = f.get("code", "")
            lang = f.get("language", "Generic")
            lines = code.splitlines()

            in_function = False
            func_name = ""
            func_start_line = 1
            func_line_count = 0
            indent_level_max = 0

            for line_idx, line in enumerate(lines, start=1):
                raw_indent = len(line) - len(line.lstrip())
                if line.strip() and raw_indent > indent_level_max:
                    indent_level_max = raw_indent

                func_match = re.search(r'^\s*(def|function|public\s+\w+|private\s+\w+|protected\s+\w+|func|fn)\s+([A-Za-z0-9_]+)\s*\(', line)
                if func_match:
                    if in_function and func_line_count > 45:
                        findings.append({
                            "id": "QUAL-001",
                            "category": "Code Quality",
                            "title": "Long Function / Method",
                            "severity": "MEDIUM",
                            "file": filename,
                            "line": func_start_line,
                            "code_snippet": f"Function '{func_name}' ({func_line_count} lines)",
                            "description": f"Function '{func_name}' is {func_line_count} lines long (threshold: 45 lines). Long functions are difficult to test and maintain.",
                            "recommendation": "Decompose into smaller, single-responsibility helper functions."
                        })
                        total_penalty += 10
                    
                    in_function = True
                    func_name = func_match.group(2)
                    func_start_line = line_idx
                    func_line_count = 1

                    param_section = line[line.find("(")+1 : line.rfind(")")] if ")" in line else ""
                    params = [p.strip() for p in param_section.split(",") if p.strip() and p.strip() not in ("self", "cls", "this")]
                    if len(params) > 5:
                        findings.append({
                            "id": "QUAL-002",
                            "category": "Code Quality",
                            "title": "Excessive Parameter List",
                            "severity": "LOW",
                            "file": filename,
                            "line": line_idx,
                            "code_snippet": line.strip()[:100],
                            "description": f"Function '{func_name}' takes {len(params)} parameters. Excessive parameters increase coupling.",
                            "recommendation": "Group parameters into a configuration object, Pydantic model, or dataclass."
                        })
                        total_penalty += 5
                elif in_function:
                    func_line_count += 1

                magic_match = re.search(r'(?<![A-Za-z0-9_])([2-9]\d{2,}|86400|3600|1000|8080|999)(?![A-Za-z0-9_])', line)
                if magic_match and not ("const" in line.lower() or "final" in line.lower() or "=" in line and line.strip().isupper()):
                    if not line.strip().startswith("//") and not line.strip().startswith("#"):
                        val = magic_match.group(1)
                        if val not in ("100", "200", "404", "500"):
                            findings.append({
                                "id": "QUAL-003",
                                "category": "Code Quality",
                                "title": "Magic Number In Code",
                                "severity": "LOW",
                                "file": filename,
                                "line": line_idx,
                                "code_snippet": line.strip()[:100],
                                "description": f"Unexplained numeric constant '{val}' found inline.",
                                "recommendation": f"Extract '{val}' into a named constant at module or class level."
                            })
                            total_penalty += 3

                if re.match(r'^\s*(#|//)\s*(def |function |if |for |while |return |class |var |let |const )', line):
                    findings.append({
                        "id": "QUAL-004",
                        "category": "Code Quality",
                        "title": "Commented-out Dead Code",
                        "severity": "LOW",
                        "file": filename,
                        "line": line_idx,
                        "code_snippet": line.strip()[:100],
                        "description": "Commented-out code increases clutter and cognitive overhead.",
                        "recommendation": "Remove dead code and rely on Git version control for history."
                    })
                    total_penalty += 2

                if re.search(r'(except\s*:|catch\s*\([^)]*\)\s*\{\s*\})', line):
                    findings.append({
                        "id": "QUAL-005",
                        "category": "Code Quality",
                        "title": "Bare or Empty Exception Handler",
                        "severity": "HIGH",
                        "file": filename,
                        "line": line_idx,
                        "code_snippet": line.strip(),
                        "description": "Catching all exceptions silently masks critical errors.",
                        "recommendation": "Catch specific exception types and log or re-raise errors."
                    })
                    total_penalty += 12

            if indent_level_max >= 16:
                findings.append({
                    "id": "QUAL-006",
                    "category": "Code Quality",
                    "title": "Deep Control Flow Nesting",
                    "severity": "MEDIUM",
                    "file": filename,
                    "line": 1,
                    "code_snippet": f"Max nesting depth reached ({indent_level_max // 4} levels)",
                    "description": "Deeply nested loops and conditions harm readability and maintainability.",
                    "recommendation": "Use guard clauses (early returns) or extract inner blocks into separate functions."
                })
                total_penalty += 8

            if lang == "Python":
                try:
                    tree = ast.parse(code, filename=filename)
                    for node in ast.walk(tree):
                        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                            doc = ast.get_docstring(node)
                            if not doc and not node.name.startswith("_"):
                                findings.append({
                                    "id": "QUAL-007",
                                    "category": "Code Quality",
                                    "title": "Missing Docstring / Documentation",
                                    "severity": "LOW",
                                    "file": filename,
                                    "line": node.lineno,
                                    "code_snippet": f"def {node.name}(...)",
                                    "description": f"Public definition '{node.name}' lacks documentation/docstring.",
                                    "recommendation": "Add a clear docstring describing inputs, outputs, and purpose."
                                })
                                total_penalty += 3
                        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                            if node.id.lower() in cls.POOR_VAR_NAMES and node.id not in ("i", "j", "k"):
                                findings.append({
                                    "id": "QUAL-008",
                                    "category": "Code Quality",
                                    "title": "Ambiguous Variable Name",
                                    "severity": "LOW",
                                    "file": filename,
                                    "line": getattr(node, "lineno", 1),
                                    "code_snippet": f"{node.id} = ...",
                                    "description": f"Variable name '{node.id}' is ambiguous and non-descriptive.",
                                    "recommendation": "Rename variable to clearly convey its domain purpose."
                                })
                                total_penalty += 2
                except SyntaxError:
                    pass

        score = max(0, min(100, 100 - total_penalty))
        maintainability = max(0, min(100, score - int(total_penalty * 0.15)))

        rec_set = []
        for f in findings:
            if f.get("recommendation") and f["recommendation"] not in rec_set:
                rec_set.append(f["recommendation"])

        return {
            "score": score,
            "maintainability_score": maintainability,
            "findings": findings,
            "findings_count": len(findings),
            "recommendations": rec_set if rec_set else ["Code structure adheres to standard quality guidelines."]
        }