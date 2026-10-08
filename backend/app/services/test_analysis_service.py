import re
from typing import List, Dict, Any

class TestAnalysisService:
    """
    Automated Test Coverage & Gap Analysis Service.
    Detects whether modified code has accompanying tests and flags uncovered logic.
    """

    @classmethod
    def analyze_tests(
        cls,
        files: List[Dict[str, Any]],
        findings: Any = None,
        diff_summary: Any = None,
        **kwargs
    ) -> Dict[str, Any]:
        test_files_present = []
        source_files = []
        untested_functions = []
        findings = findings or []

        for f in files:
            fname = str(f.get("filename", "")).lower()
            if any(k in fname for k in ("test_", "_test", ".spec.", ".test.", "tests/")):
                test_files_present.append(f.get("filename"))
            else:
                source_files.append(f)

        # Scan source files for modified functions without tests
        for sf in source_files:
            code = sf.get("code", "")
            fname = sf.get("filename", "code.py")
            # Extract function definitions
            func_names = re.findall(r"\bdef\s+([a-zA-Z0-9_]+)\s*\(", code)
            if not func_names:
                func_names = re.findall(r"\bfunction\s+([a-zA-Z0-9_]+)\s*\(", code)

            for fn in func_names:
                if fn.startswith("__"):
                    continue
                # Check if this function name appears in any test file
                covered = False
                for tf_name in test_files_present:
                    # Look up test file code if available
                    for tf in files:
                        if tf.get("filename") == tf_name and fn in tf.get("code", ""):
                            covered = True
                            break
                if not covered:
                    untested_functions.append({
                        "file": fname,
                        "function": fn,
                        "risk": "HIGH" if any(f.get("file") == fname and f.get("severity") in ("CRITICAL", "HIGH") for f in findings) else "MEDIUM"
                    })

        coverage_status = (
            "ADEQUATE" if len(test_files_present) > 0 and len(untested_functions) == 0
            else "NEEDS_TESTS" if len(test_files_present) == 0 or len(untested_functions) > 0
            else "ADEQUATE"
        )

        return {
            "coverage_status": coverage_status,
            "has_tests_included": len(test_files_present) > 0,
            "test_files_count": len(test_files_present),
            "test_files": test_files_present,
            "untested_functions_count": len(untested_functions),
            "untested_functions": untested_functions[:6],
            "recommendation": (
                "All modified units are paired with dedicated test coverage."
                if coverage_status == "ADEQUATE"
                else f"Missing automated test coverage for {len(untested_functions)} function(s). Add unit tests before merging."
            )
        }
