import os
import uuid
import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ..agents.security_agent import SecurityAgent
from ..agents.quality_agent import QualityAgent
from ..agents.performance_agent import PerformanceAgent
from ..agents.testing_agent import TestingAgent
from ..agents.prediction_agent import PredictionAgent

from ..utils.scoring import ScoringCalculator
from ..utils.consensus import ConsensusEngine
from .ai_service import AIService
from .pdf_service import PDFReportService
from .refactor_service import CodeRefactorService
from .static_analysis_service import StaticAnalysisService
from .deduplication_service import FindingDeduplicationService
from .impact_analysis_service import ImpactAnalysisService
from .test_analysis_service import TestAnalysisService
from .pr_comment_service import PRCommentService
from .review_decision_service import ReviewDecisionService
from ..database.models import Review

class ReviewService:
    @classmethod
    def execute_review(cls, db: Session, processed_input: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        review_id = f"REV-{uuid.uuid4().hex[:8].upper()}"
        created_at_dt = datetime.datetime.utcnow()
        created_at_str = created_at_dt.strftime("%Y-%m-%d %H:%M:%S UTC")

        files = processed_input.get("files", [])
        target_name = processed_input.get("target_name", "code_snippet")
        source_type = processed_input.get("source_type", "paste")
        primary_lang = processed_input.get("primary_language", "Generic")
        diff_summary = processed_input.get("diff_summary", {})

        # 1. Execute 5 Multi-Agent Analyzers
        sec_res = SecurityAgent.analyze(files)
        qual_res = QualityAgent.analyze(files)
        perf_res = PerformanceAgent.analyze(files)
        test_res = TestingAgent.analyze(files)
        pred_res = PredictionAgent.analyze(sec_res, qual_res, perf_res, test_res)

        # 1b. Execute Deterministic Static Analysis (Bandit, Radon, Ruff, Linters)
        static_analysis = StaticAnalysisService.run_all(files)
        static_findings = static_analysis.get("findings", [])

        # 2. Calculate Local Scores
        scores = ScoringCalculator.calculate_scores(
            security_score=sec_res["score"],
            quality_score=qual_res["score"],
            performance_score=perf_res["score"],
            testing_score=test_res["score"],
            maintainability_score=qual_res["maintainability_score"]
        )

        # 3. Aggregate All Findings
        raw_findings = []
        for f in sec_res.get("findings", []):
            if "source" not in f:
                f["source"] = "Security Agent"
            raw_findings.append(f)
        for f in qual_res.get("findings", []):
            if "source" not in f:
                f["source"] = "Quality Agent"
            raw_findings.append(f)
        for f in perf_res.get("findings", []):
            if "source" not in f:
                f["source"] = "Performance Agent"
            raw_findings.append(f)
        for f in test_res.get("findings", []):
            if "source" not in f:
                f["source"] = "Testing Agent"
            raw_findings.append(f)
        raw_findings.extend(static_findings)

        # 4. External Groq AI Analysis
        external_ai_res = AIService.review_code_with_groq(files)
        if external_ai_res and "findings" in external_ai_res:
            for f in external_ai_res.get("findings", []):
                if "source" not in f:
                    f["source"] = "Groq AI"
                raw_findings.append(f)

        # 4b. Finding Deduplication, Multi-Source Verification, Confidence Score
        deduped_findings = FindingDeduplicationService.deduplicate_and_verify(raw_findings)

        # 4c. Change Impact Analysis
        impact_analysis = ImpactAnalysisService.analyze_impact(
            files=files,
            diff_summary=diff_summary,
            findings=deduped_findings
        )

        # 4d. Automated Test Coverage & Missing Test Cases Analysis
        test_analysis = TestAnalysisService.analyze_tests(
            files=files,
            diff_summary=diff_summary
        )

        # 4e. Pinned PR Review Comments (Line-level GitHub style)
        pr_comments = PRCommentService.generate_comments(
            files=files,
            findings=deduped_findings,
            diff_summary=diff_summary
        )

        # 4f. Review Decision & Executive PR Summary
        review_decision = ReviewDecisionService.evaluate_decision(
            findings=deduped_findings,
            files=files,
            diff_summary=diff_summary,
            test_analysis=test_analysis,
            impact_analysis=impact_analysis,
            overall_score=scores["overall"]
        )
        pr_summary = review_decision.get("pr_summary", {})

        # Aggregated Recommendations
        all_recommendations = []
        for r_list in [sec_res.get("recommendations", []), qual_res.get("recommendations", []), perf_res.get("recommendations", []), test_res.get("recommendations", [])]:
            for rec in r_list:
                if rec and rec not in all_recommendations:
                    all_recommendations.append(rec)

        generated_tests = test_res.get("generated_tests", [])

        # 5. Extract or Synthesize Improved Code
        improved_code = None
        code_improvements = []

        if external_ai_res:
            improved_code = external_ai_res.get("improved_code")
            code_improvements = external_ai_res.get("code_improvements", [])

        if not improved_code:
            improved_code, local_improvements = CodeRefactorService.generate_improved_code(
                files=files,
                findings=deduped_findings,
                primary_lang=primary_lang
            )
            if not code_improvements:
                code_improvements = local_improvements

        groq_score = external_ai_res.get("overall_score") if external_ai_res else None
        groq_risk = external_ai_res.get("risk_score") if external_ai_res else None
        groq_risk_level = external_ai_res.get("risk_level") if external_ai_res else None

        # 6. Consensus & Confidence Engine
        consensus_res = ConsensusEngine.evaluate_consensus(
            local_score=scores["overall"],
            local_risk=pred_res["overall_risk"],
            local_risk_level=pred_res["risk_level"],
            groq_score=groq_score,
            groq_risk=groq_risk,
            groq_risk_level=groq_risk_level
        )

        # Build comprehensive review data structure
        review_data = {
            "review_id": review_id,
            "user_id": user_id,
            "created_at": created_at_str,
            "source_type": source_type,
            "target_name": target_name,
            "primary_language": primary_lang,
            "total_files": processed_input.get("total_files", len(files)),
            "total_lines": processed_input.get("total_lines", 0),
            "scores": scores,
            "predictions": pred_res,
            "consensus": consensus_res,
            "external_ai": external_ai_res,
            "findings": deduped_findings,
            "recommendations": all_recommendations,
            "generated_tests": generated_tests,
            "improved_code": improved_code,
            "code_improvements": code_improvements,
            "static_analysis": static_analysis,
            "impact_analysis": impact_analysis,
            "test_analysis": test_analysis,
            "pr_comments": pr_comments,
            "review_decision": review_decision,
            "pr_summary": pr_summary,
            "diff_summary": diff_summary,
            "files": [
                {
                    "filename": f.get("filename"),
                    "language": f.get("language"),
                    "lines_count": f.get("lines_count", 0),
                    "code": f.get("code", "")[:12000],
                    "status": f.get("status", "modified"),
                    "added_lines": f.get("added_lines", []),
                    "deleted_lines": f.get("deleted_lines", []),
                    "hunks": f.get("hunks", [])
                }
                for f in files[:10]
            ],
            "agent_details": {
                "security": sec_res,
                "quality": qual_res,
                "performance": perf_res,
                "testing": test_res,
                "prediction": pred_res
            }
        }

        # 6. Generate PDF Report
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        reports_dir = os.path.join(base_dir, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_filename = f"report_{review_id}_{user_id}.pdf"
        pdf_full_path = os.path.join(reports_dir, pdf_filename)

        try:
            PDFReportService.generate_pdf_report(review_data, pdf_full_path)
            review_data["pdf_report_path"] = pdf_full_path
            review_data["pdf_filename"] = pdf_filename
        except Exception as e:
            # Fallback if PDF generation encounters error
            review_data["pdf_report_path"] = ""
            review_data["pdf_filename"] = ""

        # 7. Persist into SQLite Database
        db_review = Review(
            id=review_id,
            user_id=user_id,
            created_at=created_at_dt,
            source_type=source_type,
            target_name=target_name,
            language=primary_lang,
            overall_score=scores["overall"],
            risk_score=pred_res["overall_risk"],
            risk_level=pred_res["risk_level"],
            future_bug_prob=pred_res["future_bug_probability"],
            consensus_agreement=consensus_res.get("comparison", {}).get("agreement", "HIGH"),
            confidence=consensus_res.get("confidence", 90),
            pdf_report_path=pdf_full_path if os.path.exists(pdf_full_path) else "",
            review_data=json.dumps(review_data)
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)

        return review_data