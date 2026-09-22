import os
import re
import zipfile
import tarfile
import tempfile
import shutil
from typing import List, Dict, Any, Optional

EXTENSION_TO_LANGUAGE = {
    # Python
    ".py": "Python",
    ".pyw": "Python",
    ".ipynb": "Python",
    # Java
    ".java": "Java",
    # JavaScript / TypeScript
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".mts": "TypeScript",
    ".cts": "TypeScript",
    # C / C++
    ".c": "C",
    ".h": "C",
    ".cpp": "C++",
    ".hpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".hh": "C++",
    ".hxx": "C++",
    # C#
    ".cs": "C#",
    ".csx": "C#",
    # Go
    ".go": "Go",
    # Rust
    ".rs": "Rust",
    # Ruby
    ".rb": "Ruby",
    ".erb": "Ruby",
    ".rake": "Ruby",
    # PHP
    ".php": "PHP",
    ".phtml": "PHP",
    # Swift
    ".swift": "Swift",
    # Kotlin
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    # Dart
    ".dart": "Dart",
    # Scala
    ".scala": "Scala",
    # Shell / Scripting
    ".sh": "Shell",
    ".bash": "Shell",
    ".zsh": "Shell",
    ".ksh": "Shell",
    ".ps1": "PowerShell",
    ".psm1": "PowerShell",
    # Web / Markup / Style
    ".html": "HTML",
    ".htm": "HTML",
    ".xhtml": "HTML",
    ".css": "CSS",
    ".scss": "CSS",
    ".sass": "CSS",
    ".less": "CSS",
    # Data / Query / Config
    ".sql": "SQL",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".xml": "XML",
    ".ini": "Config",
    ".env": "Config",
    # Documentation & Text
    ".md": "Markdown",
    ".markdown": "Markdown",
    ".txt": "Text",
    ".rst": "Documentation",
}

BINARY_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bin", ".obj", ".o", ".a", ".lib",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".bmp", ".tiff",
    ".mp4", ".mp3", ".wav", ".avi", ".mov", ".flv", ".mkv",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".7z", ".rar", ".iso", ".dmg",
    ".ttf", ".woff", ".woff2", ".eot", ".otf",
    ".pyc", ".pyo", ".pyd", ".class", ".jar", ".war"
}

IGNORED_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "venv", ".venv", "env",
    "__pycache__", ".pytest_cache", ".next", ".nuxt", "dist", "build",
    "bin", "obj", "out", "target", ".idea", ".vscode", "vendor"
}

class InputProcessor:
    @staticmethod
    def detect_language(filename: str, code: str = "") -> str:
        basename = os.path.basename(filename).lower()
        if basename == "dockerfile" or basename.endswith(".dockerfile"):
            return "Dockerfile"
        if basename == "makefile" or basename.endswith(".mk"):
            return "Makefile"
        if basename == "jenkinsfile":
            return "Groovy"

        ext = os.path.splitext(filename.lower())[1]
        if ext in EXTENSION_TO_LANGUAGE:
            return EXTENSION_TO_LANGUAGE[ext]

        # Content-based heuristic fallback
        if "def " in code and ("import " in code or ":" in code):
            return "Python"
        if "public class " in code or "System.out.println" in code:
            return "Java"
        if "function " in code or "const " in code or "console.log" in code or "let " in code:
            return "JavaScript"
        if "package " in code and "func " in code:
            return "Go"
        if "fn main()" in code or "pub fn " in code or "let mut " in code:
            return "Rust"
        if "fun main(" in code or "val " in code and "var " in code:
            return "Kotlin"
        if "import Swift" in code or "import Foundation" in code:
            return "Swift"
        if "using System;" in code or "namespace " in code:
            return "C#"
        if "#include <" in code:
            return "C++" if "std::" in code or "class " in code else "C"
        if "<?php" in code:
            return "PHP"
        if "<!DOCTYPE html>" in code or ("<html" in code and "</html>" in code):
            return "HTML"
        if "SELECT " in code.upper() and " FROM " in code.upper():
            return "SQL"
        if code.strip().startswith(("#!/bin/bash", "#!/bin/sh", "#!/usr/bin/env bash")):
            return "Shell"

        return "Generic"

    @classmethod
    def is_supported_file(cls, filename: str) -> bool:
        basename = os.path.basename(filename).lower()
        if basename in ("dockerfile", "makefile", "jenkinsfile", "gemfile", "procfile", "vagrantfile"):
            return True
        ext = os.path.splitext(filename.lower())[1]
        if ext in EXTENSION_TO_LANGUAGE:
            return True
        if ext in BINARY_EXTENSIONS:
            return False
        # Any text/code file is supported
        return True

    @classmethod
    def process_pasted_code(cls, code: str, filename: Optional[str] = None, language: Optional[str] = None) -> Dict[str, Any]:
        if not code or not code.strip():
            raise ValueError("Pasted code cannot be empty.")

        final_filename = filename.strip() if filename and filename.strip() else "snippet.py"
        detected_lang = language if language and language != "auto" else cls.detect_language(final_filename, code)
        lines = code.splitlines()

        return {
            "source_type": "paste",
            "target_name": final_filename,
            "primary_language": detected_lang,
            "total_files": 1,
            "total_lines": len(lines),
            "files": [
                {
                    "filename": final_filename,
                    "language": detected_lang,
                    "code": code,
                    "lines_count": len(lines)
                }
            ]
        }

    @classmethod
    def process_uploaded_file(cls, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        lower_name = filename.lower()
        # Handle ZIP or TAR archives
        if lower_name.endswith(".zip"):
            return cls._process_zip(file_bytes, filename)
        if lower_name.endswith((".tar", ".tar.gz", ".tgz", ".tar.bz2")):
            return cls._process_tar(file_bytes, filename)

        if not cls.is_supported_file(filename):
            raise ValueError(f"Unsupported file format '{filename}'. Please upload source code, scripts, configs, or an archive (.zip, .tar.gz).")

        try:
            code = file_bytes.decode("utf-8", errors="replace")
        except Exception as e:
            raise ValueError(f"Failed to read file as text: {str(e)}")

        lang = cls.detect_language(filename, code)
        lines = code.splitlines()

        return {
            "source_type": "upload",
            "target_name": filename,
            "primary_language": lang,
            "total_files": 1,
            "total_lines": len(lines),
            "files": [
                {
                    "filename": filename,
                    "language": lang,
                    "code": code,
                    "lines_count": len(lines)
                }
            ]
        }

    @classmethod
    def _process_zip(cls, zip_bytes: bytes, zip_name: str) -> Dict[str, Any]:
        temp_dir = tempfile.mkdtemp(prefix="review_zip_")
        zip_path = os.path.join(temp_dir, "archive.zip")
        try:
            with open(zip_path, "wb") as f:
                f.write(zip_bytes)

            extract_dir = os.path.join(temp_dir, "extracted")
            os.makedirs(extract_dir, exist_ok=True)

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(extract_dir)

            return cls.process_directory(extract_dir, source_type="upload", target_name=zip_name)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    @classmethod
    def _process_tar(cls, tar_bytes: bytes, tar_name: str) -> Dict[str, Any]:
        temp_dir = tempfile.mkdtemp(prefix="review_tar_")
        tar_path = os.path.join(temp_dir, "archive.tar")
        try:
            with open(tar_path, "wb") as f:
                f.write(tar_bytes)

            extract_dir = os.path.join(temp_dir, "extracted")
            os.makedirs(extract_dir, exist_ok=True)

            with tarfile.open(tar_path, "r:*") as tar_ref:
                tar_ref.extractall(extract_dir)

            return cls.process_directory(extract_dir, source_type="upload", target_name=tar_name)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    @classmethod
    def process_directory(cls, dir_path: str, source_type: str = "repository", target_name: str = "project") -> Dict[str, Any]:
        if not os.path.exists(dir_path):
            raise ValueError(f"Directory '{dir_path}' does not exist.")

        discovered_files = []
        total_lines = 0
        lang_counts = {}

        for root, dirs, files in os.walk(dir_path):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

            for file in sorted(files):
                if not cls.is_supported_file(file):
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, dir_path).replace("\\", "/")

                if os.path.getsize(full_path) > 1024 * 1024:
                    continue

                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        code = f.read()
                except Exception:
                    continue

                lang = cls.detect_language(file, code)
                lines_count = len(code.splitlines())

                lang_counts[lang] = lang_counts.get(lang, 0) + 1
                total_lines += lines_count

                discovered_files.append({
                    "filename": rel_path,
                    "language": lang,
                    "code": code,
                    "lines_count": lines_count
                })

        if not discovered_files:
            raise ValueError("No supported source code files found in the target.")

        primary_lang = max(lang_counts.items(), key=lambda x: x[1])[0] if lang_counts else "Generic"

        return {
            "source_type": source_type,
            "target_name": target_name,
            "primary_language": primary_lang,
            "total_files": len(discovered_files),
            "total_lines": total_lines,
            "files": discovered_files
        }

    @classmethod
    def process_multiple_files(cls, file_items: list, target_name: str = "batch_upload") -> dict:
        discovered_files = []
        total_lines = 0
        lang_counts = {}
        for item in file_items:
            fname = item.get("filename", "file.py")
            raw_content = item.get("content", "")
            if isinstance(raw_content, bytes):
                code = raw_content.decode("utf-8", errors="replace")
            else:
                code = str(raw_content)

            if not cls.is_supported_file(fname):
                continue
            lang = cls.detect_language(fname, code)
            lines = code.splitlines()
            total_lines += len(lines)
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
            discovered_files.append({
                "filename": fname,
                "language": lang,
                "code": code,
                "lines_count": len(lines)
            })

        if not discovered_files:
            raise ValueError("No supported code files found in upload.")

        primary_lang = max(lang_counts.items(), key=lambda x: x[1])[0] if lang_counts else "Generic"
        return {
            "source_type": "batch_upload",
            "target_name": target_name,
            "primary_language": primary_lang,
            "total_files": len(discovered_files),
            "total_lines": total_lines,
            "files": discovered_files
        }
