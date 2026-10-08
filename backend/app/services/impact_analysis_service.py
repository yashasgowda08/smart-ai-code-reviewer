from typing import List, Dict, Any

class ImpactAnalysisService:
    """
    Change Impact Analysis Service.
    Evaluates blast radius of changes:
    - Breaking API contract risks
    - Database and schema impacts
    - Security and auth logic modifications
    - Affected subsystem boundaries
    """

    @classmethod
    def analyze_impact(
        cls,
        files: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        diff_summary: Any = None,
        **kwargs
    ) -> Dict[str, Any]:
        affected_components = set()
        risky_modifications = []
        breaking_risk = "LOW"

        has_auth_change = False
        has_db_change = False
        has_api_change = False
        has_critical_findings = any(f.get("severity") == "CRITICAL" for f in findings)
        has_high_findings = any(f.get("severity") == "HIGH" for f in findings)

        for f in files:
            fname = str(f.get("filename", "")).lower()
            code = str(f.get("code", "")).lower()

            # 1. Auth & Security Subsystem
            if any(k in fname for k in ("auth", "login", "jwt", "session", "permission", "crypto", "token", "user")):
                affected_components.add("Authentication & Identity Access (IAM)")
                has_auth_change = True
                risky_modifications.append({
                    "area": "Authentication",
                    "file": f.get("filename"),
                    "risk": "HIGH",
                    "warning": "Authentication / Identity module modified. Ensure token expiry, credential encryption, and permission gates remain intact."
                })

            # 2. Database & Persistence Layer
            if any(k in fname for k in ("model", "db", "database", "migration", "schema", "repository", "sql")) or any(k in code for k in ("alter table", "drop table", "select *", "session.query")):
                affected_components.add("Data Persistence & Database Layer")
                has_db_change = True
                if "drop " in code or "alter " in code or "delete from" in code:
                    risky_modifications.append({
                        "area": "Database Schema",
                        "file": f.get("filename"),
                        "risk": "HIGH",
                        "warning": "Destructive DDL/DML pattern detected. Verify database migration rollback scripts and backward compatibility."
                    })

            # 3. API & External Integration
            if any(k in fname for k in ("router", "route", "api", "controller", "endpoint", "views")):
                affected_components.add("Public HTTP / REST API Surface")
                has_api_change = True

            # 4. Core Business Logic
            if any(k in fname for k in ("service", "engine", "handler", "manager")):
                affected_components.add("Core Domain Business Logic")

        if not affected_components:
            affected_components.add("Application Modules")

        # Determine breaking risk
        if has_critical_findings or (has_auth_change and has_high_findings):
            breaking_risk = "HIGH"
        elif has_db_change or has_api_change or has_high_findings:
            breaking_risk = "MEDIUM"
        else:
            breaking_risk = "LOW"

        # Summary text
        summary = (
            f"High-impact change affecting {len(affected_components)} application subsystems. Rigorous regression testing required."
            if breaking_risk == "HIGH"
            else f"Moderate scope change touching {', '.join(list(affected_components)[:2])}. Standard integration tests recommended."
            if breaking_risk == "MEDIUM"
            else "Low-risk targeted modification with isolated architectural blast radius."
        )

        return {
            "breaking_risk": breaking_risk,
            "risk_level": breaking_risk,
            "affected_components": sorted(list(affected_components)),
            "risky_modifications": risky_modifications,
            "has_auth_modifications": has_auth_change,
            "has_database_modifications": has_db_change,
            "has_api_modifications": has_api_change,
            "impact_summary": summary
        }
