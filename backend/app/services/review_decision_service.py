from typing import List, Dict, Any

class ReviewDecisionService:
    """
    PR Summary & Merge Decision Engine.
    Computes overall verdict:
    - ✅ Approve
    - ⚠️ Approve with suggestions
    - 🔄 Request changes
    """

    @classmethod
    def evaluate_decision(
        cls,
        findings: List[Dict[str, Any]],
        quality_score: Any = None,
        impact_analysis: Any = None,
        test_analysis: Any = None,
        diff_summary: Any = None,
        files: Any = None,
        overall_score: Any = None,
        **kwargs
    ) -> Dict[str, Any]:
        if quality_score is None:
            quality_score = overall_score if overall_score is not None else 70
        impact_analysis = impact_analysis or {}
        test_analysis = test_analysis or {}
        diff_summary = diff_summary or {}

        crit_count = sum(1 for f in findings if f.get("severity") == "CRITICAL")
        high_count = sum(1 for f in findings if f.get("severity") == "HIGH")
        med_count = sum(1 for f in findings if f.get("severity") == "MEDIUM")
        low_count = sum(1 for f in findings if f.get("severity") == "LOW")

        blocking_issues = [f for f in findings if f.get("severity") in ("CRITICAL", "HIGH")]

        reasons = []

        if crit_count > 0:
            reasons.append(f"Found {crit_count} CRITICAL security/correctness defect(s) that must be resolved before merge.")
        if high_count > 0:
            reasons.append(f"Found {high_count} HIGH severity vulnerability/defect(s).")
        if impact_analysis.get("breaking_risk") == "HIGH":
            reasons.append("High breaking change risk identified in core application components.")

        # Determine Decision
        if crit_count > 0 or high_count > 0 or impact_analysis.get("breaking_risk") == "HIGH":
            decision = "REQUEST_CHANGES"
            label = "Request Changes"
            icon = "🔄"
            color = "#ef4444"
            recommended_action = "Block merge. Remediate flagged high/critical vulnerabilities before re-requesting review."
        elif med_count > 0 or quality_score < 75 or test_analysis.get("coverage_status") != "ADEQUATE":
            decision = "APPROVE_WITH_SUGGESTIONS"
            label = "Approve with Suggestions"
            icon = "⚠️"
            color = "#f59e0b"
            if med_count > 0:
                reasons.append(f"Address {med_count} moderate code quality finding(s).")
            if test_analysis.get("coverage_status") != "ADEQUATE":
                reasons.append("Consider adding unit test coverage for newly introduced logic.")
            recommended_action = "Mergeable once non-blocking quality and test suggestions are addressed."
        else:
            decision = "APPROVE"
            label = "Approve"
            icon = "✅"
            color = "#10b981"
            reasons = [
                "All security and quality gates passed successfully.",
                "Zero Critical or High severity findings detected.",
                "Code change satisfies architectural hygiene standards."
            ]
            recommended_action = "PR is clean, verified, and ready to merge."

        # Overall risk level
        overall_risk = "CRITICAL" if crit_count > 0 else "HIGH" if high_count > 0 else "MEDIUM" if med_count > 0 else "LOW"

        # Executive PR Markdown Summary
        files_count = diff_summary.get("files_changed", 1)
        additions = diff_summary.get("additions", 0)
        deletions = diff_summary.get("deletions", 0)

        markdown_summary = f"""### {icon} PR Review Decision: {label}

**Quality Score:** {quality_score}/100 | **Overall Risk:** {overall_risk}
**Changes:** {files_count} file(s) changed (+{additions} / -{deletions})

#### Issues Breakdown:
- 🚨 **Critical:** {crit_count}
- ⚠️ **High:** {high_count}
- ℹ️ **Medium:** {med_count}
- 💡 **Low:** {low_count}

#### Key Findings & Rationale:
""" + "\n".join(f"- {r}" for r in reasons) + f"""

**Recommended Action:** {recommended_action}
"""

        return {
            "decision": decision,
            "label": label,
            "icon": icon,
            "color": color,
            "reasons": reasons,
            "blocking_issues_count": len(blocking_issues),
            "blocking_issues": blocking_issues[:5],
            "pr_summary": {
                "files_changed": files_count,
                "additions": additions,
                "deletions": deletions,
                "total_issues": len(findings),
                "severity_breakdown": {
                    "CRITICAL": crit_count,
                    "HIGH": high_count,
                    "MEDIUM": med_count,
                    "LOW": low_count
                },
                "overall_risk": overall_risk,
                "quality_score": quality_score,
                "recommended_action": recommended_action,
                "markdown_summary": markdown_summary
            }
        }
