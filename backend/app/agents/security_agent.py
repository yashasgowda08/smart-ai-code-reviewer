import re
import ast
from typing import List, Dict, Any

class SecurityAgent:
    SECURITY_PATTERNS = [
        {
            "id": "SEC-001",
            "title": "Hardcoded Secret / Password",
            "pattern": r"(?i)(password|passwd|secret|api_key|apikey|access_token|auth_token|private_key|client_secret)\s*=\s*['\"][A-Za-z0-9_\-\.\@\#\$%\^\&\*\!\~\/\+=]{6,}['\"]",
            "severity": "CRITICAL",
            "penalty": 25,
            "cwe": "CWE-798",
            "description": "Hardcoded credentials or API secrets detected in source code.",
            "recommendation": "Move secrets to environment variables (e.g. os.getenv or process.env) or a secure secrets manager."
        },
        {
            "id": "SEC-002",
            "title": "AWS / Cloud Access Key Exposed",
            "pattern": r"(?i)(AKIA[0-9A-Z]{16}|aws_secret_access_key|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[0-9a-zA-Z]{10,48})",
            "severity": "CRITICAL",
            "penalty": 30,
            "cwe": "CWE-798",
            "description": "Exposed cloud provider or third-party service credential token.",
            "recommendation": "Revoke this key immediately and inject credentials via environment variables."
        },
        {
            "id": "SEC-003",
            "title": "Potential SQL Injection",
            "pattern": r"(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*?\s*(\+|%|\.format|f['\"]).*?(FROM|INTO|TABLE|WHERE|SET)",
            "severity": "HIGH",
            "penalty": 20,
            "cwe": "CWE-89",
            "description": "Dynamic SQL query constructed using string formatting or concatenation.",
            "recommendation": "Use parameterized queries or ORM query builders (e.g. SQLAlchemy, PreparedStatements)."
        },
        {
            "id": "SEC-004",
            "title": "Command Injection Vulnerability",
            "pattern": r"(os\.system|subprocess\.(Popen|call|run)\(.*?\bshell\s*=\s*True|child_process\.exec|Runtime\.getRuntime\(\)\.exec|system\(|passthru\()",
            "severity": "CRITICAL",
            "penalty": 25,
            "cwe": "CWE-78",
            "description": "System command execution with shell=True or unescaped user parameters.",
            "recommendation": "Avoid shell=True and pass command arguments as a validated list or array."
        },
        {
            "id": "SEC-005",
            "title": "Unsafe Dynamic Code Execution (eval/exec)",
            "pattern": r"\b(eval|exec|Function)\s*\(",
            "severity": "HIGH",
            "penalty": 20,
            "cwe": "CWE-95",
            "description": "Dynamic code evaluation (eval/exec) allows arbitrary code execution.",
            "recommendation": "Refactor logic to use safe static lookups or structured parsing (e.g. ast.literal_eval, JSON.parse)."
        },
        {
            "id": "SEC-006",
            "title": "Insecure Deserialization",
            "pattern": r"(pickle\.loads|yaml\.load\(.*?Loader\s*!=\s*yaml\.SafeLoader|unserialize\(|ObjectInputStream\.readObject)",
            "severity": "HIGH",
            "penalty": 15,
            "cwe": "CWE-502",
            "description": "Deserializing untrusted data can lead to remote code execution.",
            "recommendation": "Use safe serializers like JSON or specify yaml.SafeLoader."
        },
        {
            "id": "SEC-007",
            "title": "Weak Hashing / Cryptography Algorithm",
            "pattern": r"(?i)(hashlib\.(md5|sha1)|Crypto\.Hash\.(MD5|SHA1)|MessageDigest\.getInstance\(['\"](MD5|SHA-1)['\"])",
            "severity": "MEDIUM",
            "penalty": 10,
            "cwe": "CWE-327",
            "description": "MD5/SHA1 are cryptographically broken and vulnerable to collision attacks.",
            "recommendation": "Upgrade to SHA-256, SHA-3, or Argon2/bcrypt for password hashing."
        },
        {
            "id": "SEC-008",
            "title": "Path Traversal Risk",
            "pattern": r"(\.\./|\.\.\\|open\([^)]*?\+\s*|readFile\([^)]*?\+\s*)",
            "severity": "MEDIUM",
            "penalty": 10,
            "cwe": "CWE-22",
            "description": "File access using concatenated paths without directory canonicalization.",
            "recommendation": "Sanitize path inputs with os.path.abspath and verify they reside within the intended directory."
        },
        {
            "id": "SEC-009",
            "title": "SSL Verification Disabled",
            "pattern": r"(verify\s*=\s*False|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]0['\"]|TrustAllCerts)",
            "severity": "HIGH",
            "penalty": 15,
            "cwe": "CWE-295",
            "description": "TLS certificate validation is disabled, making connections vulnerable to MITM attacks.",
            "recommendation": "Enable strict TLS certificate validation (verify=True)."
        }
    ]

    @classmethod
    def analyze(cls, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        findings = []
        recommendations = []
        total_penalty = 0

        for f in files:
            filename = f.get("filename", "unknown")
            code = f.get("code", "")
            lines = code.splitlines()

            for line_idx, line in enumerate(lines, start=1):
                stripped = line.strip()
                if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
                    continue

                for pat in cls.SECURITY_PATTERNS:
                    if re.search(pat["pattern"], line):
                        total_penalty += pat["penalty"]
                        findings.append({
                            "id": pat["id"],
                            "category": "Security",
                            "title": pat["title"],
                            "severity": pat["severity"],
                            "file": filename,
                            "line": line_idx,
                            "code_snippet": line.strip()[:120],
                            "description": pat["description"],
                            "recommendation": pat["recommendation"],
                            "cwe": pat["cwe"]
                        })
                        if pat["recommendation"] not in recommendations:
                            recommendations.append(pat["recommendation"])

            if f.get("language") == "Python":
                try:
                    tree = ast.parse(code, filename=filename)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Assert):
                            findings.append({
                                "id": "SEC-010",
                                "category": "Security",
                                "title": "Assert Used for Control Flow",
                                "severity": "LOW",
                                "file": filename,
                                "line": getattr(node, "lineno", 1),
                                "code_snippet": "assert ...",
                                "description": "Assertions can be optimized away in production with python -O.",
                                "recommendation": "Use explicit if-conditions and raise ValueError/PermissionError.",
                                "cwe": "CWE-617"
                            })
                            total_penalty += 5
                except SyntaxError:
                    pass

        score = max(0, min(100, 100 - total_penalty))
        return {
            "score": score,
            "findings": findings,
            "findings_count": len(findings),
            "recommendations": recommendations if recommendations else ["Maintain secure coding practices and audit third-party dependencies."]
        }
