import httpx
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional
from ..services.review_service import ReviewService
from ..processors.input_processor import InputProcessor
from ..database.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/fetch", tags=["URL Fetch"])

KNOWN_VULN_PACKAGES = {
    "python": {"pyyaml": "5.1", "pillow": "8.0", "requests": "2.19", "django": "3.0", "flask": "0.12", "cryptography": "3.0"},
    "node": {"lodash": "4.17.20", "axios": "0.21.0", "express": "4.17.0", "minimist": "1.2.5", "node-fetch": "2.6.0"}
}

def get_user(x_user_id: Optional[str] = Header(None, alias="X-User-ID")):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required.")
    return x_user_id

class UrlFetchRequest(BaseModel):
    url: str
    language: Optional[str] = "auto"

class DependencyScanRequest(BaseModel):
    content: str
    filename: str

@router.post("/url")
async def fetch_and_review_url(req: UrlFetchRequest, user_id: str = Depends(get_user), db: Session = Depends(get_db)):
    if not req.url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(req.url)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to fetch URL: HTTP {response.status_code}")
            code = response.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="URL fetch timed out.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL fetch error: {str(e)}")
    filename = req.url.split("/")[-1] or "fetched_code.py"
    lang = req.language if req.language != "auto" else InputProcessor.detect_language(filename, code)
    processed = InputProcessor.process_pasted_code(code=code, filename=filename, language=lang)
    processed["source_type"] = "url"
    processed["target_name"] = req.url
    result = ReviewService.execute_review(db=db, processed_input=processed, user_id=user_id)
    return {"status": "success", "data": result}

@router.post("/dependencies")
def scan_dependencies(req: DependencyScanRequest, user_id: str = Depends(get_user)):
    fname = req.filename.lower()
    findings = []
    vuln_found = []
    if fname == "requirements.txt":
        for line in req.content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"): continue
            parts = line.replace("==", " ").replace(">=", " ").replace("<=", " ").replace("~=", " ").split()
            pkg = parts[0].lower() if parts else ""
            ver = parts[1] if len(parts) > 1 else "unknown"
            if pkg in KNOWN_VULN_PACKAGES["python"]:
                findings.append({"package": pkg, "version": ver, "vulnerable_below": KNOWN_VULN_PACKAGES["python"][pkg], "severity": "HIGH", "recommendation": f"Upgrade {pkg} to latest version."})
                vuln_found.append(pkg)
    elif fname == "package.json":
        import json
        try:
            data = json.loads(req.content)
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            for pkg, ver in deps.items():
                pkg_lower = pkg.lower()
                if pkg_lower in KNOWN_VULN_PACKAGES["node"]:
                    findings.append({"package": pkg, "version": ver, "vulnerable_below": KNOWN_VULN_PACKAGES["node"][pkg_lower], "severity": "HIGH", "recommendation": f"Upgrade {pkg} to latest version."})
                    vuln_found.append(pkg)
        except Exception:
            pass
    return {
        "status": "success",
        "filename": req.filename,
        "total_packages_scanned": len(req.content.splitlines()),
        "vulnerable_packages_found": len(findings),
        "findings": findings,
        "summary": f"Scanned dependency file. Found {len(findings)} vulnerable package(s)." if findings else "No known vulnerable packages detected."
    }