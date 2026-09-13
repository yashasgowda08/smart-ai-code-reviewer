import re
from typing import List, Dict, Any

class TestingAgent:
    @classmethod
    def analyze(cls, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        findings = []
        missing_areas = []
        test_recommendations = []
        generated_tests = []
        total_penalty = 0

        for f in files:
            filename = f.get("filename", "unknown")
            code = f.get("code", "")
            lang = f.get("language", "Generic")
            lines = code.splitlines()

            has_try_catch = False
            has_input_validation = False
            detected_functions = []

            for line_idx, line in enumerate(lines, start=1):
                func_match = re.search(r'^\s*(def|function|public\s+\w+|private\s+\w+|func)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)', line)
                if func_match:
                    fname = func_match.group(2)
                    raw_args = func_match.group(3)
                    args = [a.strip().split(":")[0].split("=")[0].strip() for a in raw_args.split(",") if a.strip() and a.strip() not in ("self", "cls", "this")]
                    detected_functions.append({"name": fname, "args": args, "line": line_idx})

                if "try:" in line or "try {" in line:
                    has_try_catch = True
                if "if not " in line or ("if (" in line and ("=== null" in line or "== null" in line or "len(" in line or "is None" in line)):
                    has_input_validation = True

            if detected_functions and not has_try_catch and len(lines) > 20:
                findings.append({
                    "id": "TEST-001",
                    "category": "Testing & Resilience",
                    "title": "Missing Error Handling & Recovery",
                    "severity": "MEDIUM",
                    "file": filename,
                    "line": 1,
                    "code_snippet": f"File '{filename}' lacks try/catch or try/except structures.",
                    "description": "Operations may crash unexpectedly when receiving malformed inputs or facing I/O failures.",
                    "recommendation": "Wrap critical I/O, parsing, and calculations in defensive try-except blocks."
                })
                missing_areas.append(f"{filename}: Error Handling & Exception Recovery")
                total_penalty += 15

            if detected_functions and not has_input_validation:
                findings.append({
                    "id": "TEST-002",
                    "category": "Testing & Resilience",
                    "title": "Missing Input Boundary Validation",
                    "severity": "MEDIUM",
                    "file": filename,
                    "line": detected_functions[0]["line"] if detected_functions else 1,
                    "code_snippet": f"Functions in {filename}",
                    "description": "Parameters are consumed without explicit null, type, or boundary checks.",
                    "recommendation": "Add preconditions to validate input bounds (e.g. check for empty strings, nulls, negative numbers)."
                })
                missing_areas.append(f"{filename}: Input Boundary Validation")
                total_penalty += 10

            if lang == "Python":
                py_tests = []
                for fn in detected_functions[:4]:
                    fname = fn["name"]
                    fargs = fn["args"]
                    mock_args = ", ".join(["1" if "num" in a or "id" in a or "count" in a else "'test'" if "name" in a or "str" in a else "10" for a in fargs])
                    py_tests.append(f"""def test_{fname}_happy_path():
    \"\"\"Verify {fname} returns expected result with valid inputs.\"\"\"
    # result = {fname}({mock_args})
    # assert result is not None
    pass

def test_{fname}_edge_and_null_inputs():
    \"\"\"Verify {fname} handles null, None, and edge inputs defensively.\"\"\"
    # with pytest.raises((ValueError, TypeError)):
    #     {fname}(None)
    pass""")
                if py_tests:
                    generated_tests.append({
                        "file": f"test_{filename}",
                        "language": "Python (pytest)",
                        "code": "import pytest\n# from module import *\n\n" + "\n\n".join(py_tests)
                    })

            elif lang in ("JavaScript", "TypeScript"):
                js_tests = []
                for fn in detected_functions[:4]:
                    fname = fn["name"]
                    js_tests.append(f"""  describe('{fname}', () => {{
    it('should execute successfully with valid parameters', () => {{
      // expect({fname}(...)).toBeDefined();
    }});

    it('should handle null/undefined edge inputs defensively', () => {{
      // expect(() => {fname}(null)).toThrow();
    }});
  }});""")
                if js_tests:
                    generated_tests.append({
                        "file": f"{filename}.test.js",
                        "language": "JavaScript (Jest)",
                        "code": f"describe('{filename} Test Suite', () => {{\n" + "\n".join(js_tests) + "\n});"
                    })
            else:
                gen_list = []
                for fn in detected_functions[:3]:
                    fname = fn["name"]
                    gen_list.append(f"// Unit Test Case for {fname}:\n// 1. Positive path test with typical input.\n// 2. Negative path test with invalid/null input.\n// 3. Boundary value analysis test.")
                if gen_list:
                    generated_tests.append({
                        "file": f"tests_for_{filename}",
                        "language": lang,
                        "code": "\n\n".join(gen_list)
                    })

        score = max(0, min(100, 100 - total_penalty))
        if not detected_functions and total_penalty == 0:
            score = 85

        for ma in missing_areas:
            test_recommendations.append(f"Implement automated unit tests covering {ma}.")

        if not test_recommendations:
            test_recommendations.append("Expand unit and integration test coverage for core business logic.")

        return {
            "score": score,
            "findings": findings,
            "findings_count": len(findings),
            "missing_test_areas": missing_areas,
            "recommendations": test_recommendations,
            "generated_tests": generated_tests
        }