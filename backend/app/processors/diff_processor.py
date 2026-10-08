import re
import os
from typing import Dict, Any, List, Optional

class DiffProcessor:
    """
    Robust Unified Git Diff Parser.
    Extracts changed files, additions, deletions, hunks, and line number mappings
    to power PR-oriented static analysis and line-level comments.
    """

    @classmethod
    def is_unified_diff(cls, text: str) -> bool:
        if not text or not isinstance(text, str):
            return False
        stripped = text.strip()
        if stripped.startswith("diff --git"):
            return True
        if "--- a/" in stripped and "+++ b/" in stripped:
            return True
        if re.search(r"^@@\s+-\d+(?:,\d+)?\s+\+\d+(?:,\d+)?\s+@@", stripped, re.MULTILINE):
            return True
        return False

    @classmethod
    def parse_diff(cls, diff_str: str, target_name: Optional[str] = "pull_request.diff") -> Dict[str, Any]:
        if not diff_str or not diff_str.strip():
            raise ValueError("Git diff content cannot be empty.")

        lines = diff_str.splitlines()
        files: List[Dict[str, Any]] = []
        current_file: Optional[Dict[str, Any]] = None
        current_hunk: Optional[Dict[str, Any]] = None

        total_additions = 0
        total_deletions = 0

        diff_git_re = re.compile(r"^diff\s+--git\s+(?:a/(.+?)|(\S+))\s+(?:b/(.+?)|(\S+))$")
        old_file_re = re.compile(r"^---\s+(?:a/)?(.+)$")
        new_file_re = re.compile(r"^\+\+\+\s+(?:b/)?(.+)$")
        hunk_header_re = re.compile(r"^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$")

        current_old_line = 0
        current_new_line = 0

        i = 0
        while i < len(lines):
            line = lines[i]

            # 1. diff --git header
            git_match = diff_git_re.match(line)
            if git_match:
                if current_file:
                    cls._finalize_file(current_file)
                    files.append(current_file)

                groups = git_match.groups()
                old_name = groups[0] or groups[1] or "unknown"
                new_name = groups[2] or groups[3] or old_name
                clean_name = new_name if new_name != "/dev/null" else old_name
                clean_name = clean_name.replace("b/", "").replace("a/", "").strip()

                current_file = cls._create_file_dict(clean_name, old_name)
                current_hunk = None
                i += 1
                continue

            # 2. --- and +++ lines (when diff --git was not present, or updating filenames)
            if line.startswith("--- ") and i + 1 < len(lines) and lines[i + 1].startswith("+++ "):
                m_old = old_file_re.match(line)
                m_new = new_file_re.match(lines[i + 1])
                old_name = m_old.group(1).strip() if m_old else "unknown"
                new_name = m_new.group(1).strip() if m_new else old_name
                clean_name = new_name if new_name != "/dev/null" else old_name
                clean_name = clean_name.replace("b/", "").replace("a/", "").strip()

                if not current_file:
                    current_file = cls._create_file_dict(clean_name, old_name)
                else:
                    # Update filenames if diff --git gave placeholder
                    current_file["filename"] = clean_name
                    current_file["language"] = cls._detect_lang_from_path(clean_name)
                    if "/dev/null" in old_name:
                        current_file["status"] = "added"
                    elif "/dev/null" in new_name:
                        current_file["status"] = "deleted"

                i += 2
                continue

            # 3. Hunk header: @@ -old_start,old_count +new_start,new_count @@
            hunk_match = hunk_header_re.match(line)
            if hunk_match:
                if not current_file:
                    fallback_name = target_name if target_name and not target_name.endswith((".diff", ".patch")) else "patch_snippet.py"
                    current_file = cls._create_file_dict(fallback_name, fallback_name)

                old_start = int(hunk_match.group(1))
                old_len = int(hunk_match.group(2)) if hunk_match.group(2) else 1
                new_start = int(hunk_match.group(3))
                new_len = int(hunk_match.group(4)) if hunk_match.group(4) else 1
                heading = hunk_match.group(5).strip()

                current_hunk = {
                    "old_start": old_start,
                    "old_len": old_len,
                    "new_start": new_start,
                    "new_len": new_len,
                    "heading": heading,
                    "lines": []
                }
                current_file["hunks"].append(current_hunk)
                current_old_line = old_start
                current_new_line = new_start
                i += 1
                continue

            # 4. Inside a hunk
            if current_hunk and current_file:
                if line.startswith("+") and not line.startswith("+++"):
                    total_additions += 1
                    content = line[1:]
                    current_file["added_lines"].append({
                        "line_number": current_new_line,
                        "content": content
                    })
                    current_file["changed_line_numbers"].add(current_new_line)
                    current_file["reconstructed_lines"].append((current_new_line, content))
                    current_hunk["lines"].append({
                        "type": "add",
                        "old_line": None,
                        "new_line": current_new_line,
                        "content": content
                    })
                    current_new_line += 1
                elif line.startswith("-") and not line.startswith("---"):
                    total_deletions += 1
                    content = line[1:]
                    current_file["deleted_lines"].append({
                        "line_number": current_old_line,
                        "content": content
                    })
                    current_hunk["lines"].append({
                        "type": "del",
                        "old_line": current_old_line,
                        "new_line": None,
                        "content": content
                    })
                    current_old_line += 1
                elif line.startswith(" "):
                    content = line[1:]
                    current_file["reconstructed_lines"].append((current_new_line, content))
                    current_hunk["lines"].append({
                        "type": "context",
                        "old_line": current_old_line,
                        "new_line": current_new_line,
                        "content": content
                    })
                    current_old_line += 1
                    current_new_line += 1
                elif line.startswith("\ No newline at end of file"):
                    pass
                else:
                    # Ignore metadata lines like index, new file mode, etc.
                    pass

            i += 1

        if current_file:
            cls._finalize_file(current_file)
            files.append(current_file)

        # Fallback if no hunks were extracted
        if not files or not any(f.get("hunks") or f.get("added_lines") for f in files):
            files = cls._parse_fallback_hunks(diff_str, target_name)
            total_additions = sum(len(f["added_lines"]) for f in files)
            total_deletions = sum(len(f["deleted_lines"]) for f in files)

        if not files:
            raise ValueError("No recognizable changes found in git diff.")

        analyzable_files = []
        for f in files:
            reconstructed_code = f.get("code", "")
            analyzable_files.append({
                "filename": f["filename"],
                "language": f["language"],
                "lines_count": len(reconstructed_code.splitlines()) if reconstructed_code else 0,
                "code": reconstructed_code,
                "is_diff": True,
                "changed_line_numbers": sorted(list(f["changed_line_numbers"])),
                "added_lines": f["added_lines"],
                "deleted_lines": f["deleted_lines"],
                "status": f["status"],
                "hunks": f["hunks"]
            })

        primary_lang = files[0]["language"] if files else "Generic"
        total_lines_changed = total_additions + total_deletions

        return {
            "source_type": "git_diff",
            "target_name": target_name or "pull_request.diff",
            "primary_language": primary_lang,
            "total_files": len(files),
            "total_lines": total_lines_changed,
            "is_diff": True,
            "diff_summary": {
                "additions": total_additions,
                "deletions": total_deletions,
                "files_changed": len(files),
                "files": [
                    {
                        "filename": f["filename"],
                        "status": f["status"],
                        "additions": len(f["added_lines"]),
                        "deletions": len(f["deleted_lines"])
                    }
                    for f in files
                ]
            },
            "files": analyzable_files,
            "raw_diff": diff_str
        }

    @classmethod
    def _create_file_dict(cls, filename: str, old_filename: str) -> Dict[str, Any]:
        status = "modified"
        if "/dev/null" in old_filename:
            status = "added"
        elif "/dev/null" in filename:
            status = "deleted"
        return {
            "filename": filename,
            "old_filename": old_filename.replace("a/", "").strip(),
            "status": status,
            "language": cls._detect_lang_from_path(filename),
            "hunks": [],
            "added_lines": [],
            "deleted_lines": [],
            "modified_lines": [],
            "changed_line_numbers": set(),
            "reconstructed_lines": []
        }

    @classmethod
    def _finalize_file(cls, f_data: Dict[str, Any]):
        rec_lines = f_data.pop("reconstructed_lines", [])
        rec_lines.sort(key=lambda x: x[0])
        code_lines = [item[1] for item in rec_lines]
        f_data["code"] = "\n".join(code_lines)
        f_data["changed_line_numbers"] = sorted(list(f_data["changed_line_numbers"]))

    @classmethod
    def _parse_fallback_hunks(cls, diff_str: str, target_name: Optional[str]) -> List[Dict[str, Any]]:
        filename = target_name if target_name and not target_name.endswith((".diff", ".patch")) else "patch_snippet.py"
        added_lines = []
        deleted_lines = []
        changed_numbers = set()
        code_lines = []

        line_num = 1
        for raw_line in diff_str.splitlines():
            if raw_line.startswith("+") and not raw_line.startswith("+++"):
                content = raw_line[1:]
                added_lines.append({"line_number": line_num, "content": content})
                changed_numbers.add(line_num)
                code_lines.append(content)
                line_num += 1
            elif raw_line.startswith("-") and not raw_line.startswith("---"):
                deleted_lines.append({"line_number": line_num, "content": raw_line[1:]})
            elif raw_line.startswith(" "):
                code_lines.append(raw_line[1:])
                line_num += 1
            elif not raw_line.startswith(("@@", "---", "+++", "diff")):
                code_lines.append(raw_line)
                line_num += 1

        return [{
            "filename": filename,
            "old_filename": filename,
            "status": "modified",
            "language": cls._detect_lang_from_path(filename),
            "hunks": [],
            "added_lines": added_lines,
            "deleted_lines": deleted_lines,
            "changed_line_numbers": sorted(list(changed_numbers)),
            "code": "\n".join(code_lines)
        }]

    @classmethod
    def _detect_lang_from_path(cls, path: str) -> str:
        ext = os.path.splitext(path.lower())[1]
        mapping = {
            ".py": "Python", ".js": "JavaScript", ".jsx": "JavaScript",
            ".ts": "TypeScript", ".tsx": "TypeScript", ".java": "Java",
            ".go": "Go", ".rs": "Rust", ".cpp": "C++", ".c": "C",
            ".h": "C", ".cs": "C#", ".rb": "Ruby", ".php": "PHP",
            ".kt": "Kotlin", ".swift": "Swift", ".sql": "SQL",
            ".sh": "Shell", ".bash": "Shell", ".html": "HTML",
            ".css": "CSS", ".json": "JSON", ".yaml": "YAML", ".yml": "YAML"
        }
        return mapping.get(ext, "Generic")
