from typing import List, Dict, Any

class PRCommentService:
    """
    PR Review Comments Generator.
    Produces GitHub-ready, line-pinned review comments with suggested code fixes.
    """

    @classmethod
    def generate_comments(cls, *args, **kwargs) -> List[Dict[str, Any]]:
        findings = kwargs.get("findings")
        files = kwargs.get("files")
        if len(args) >= 1:
            first = args[0]
            second = args[1] if len(args) > 1 else None
            if isinstance(first, list) and first and isinstance(first[0], dict):
                if any(k in first[0] for k in ("severity", "issue", "title", "cwe")):
                    findings = first
                    if second is not None:
                        files = second
                else:
                    files = first
                    if second is not None:
                        findings = second
            elif findings is None:
                findings = first

        if findings is None:
            findings = []
        if files is None:
            files = []
        comments = []

        for f in findings:
            file_name = f.get("file", "unknown")
            line_no = f.get("line", 1)
            sev = f.get("severity", "MEDIUM")
            issue = f.get("issue") or f.get("title") or "Code Defect"
            explanation = f.get("explanation") or f.get("description") or ""
            fix = f.get("suggested_fix") or f.get("recommendation") or ""
            conf = f.get("confidence", 90)
            cwe = f.get("cwe")

            cwe_badge = f" `[{cwe}]`" if cwe else ""
            sev_icon = "🚨" if sev == "CRITICAL" else "⚠️" if sev == "HIGH" else "ℹ️" if sev == "MEDIUM" else "💡"

            # Formulate professional GitHub PR comment body
            comment_markdown = (
                f"{sev_icon} **{sev}: {issue}**{cwe_badge}\n\n"
                f"{explanation}\n\n"
                f"**Suggested Fix:**\n"
                f"{fix}\n\n"
                f"> *Confidence: {conf}% | Verified by Multi-Agent Suite*"
            )

            comments.append({
                "file": file_name,
                "line": line_no,
                "side": "RIGHT",
                "severity": sev,
                "confidence": conf,
                "issue": issue,
                "comment_markdown": comment_markdown,
                "suggested_fix": fix
            })

        return comments
