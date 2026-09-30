#!/usr/bin/env python3
"""
Style compliance checker for UrbanPulse "Matte Clay" Design System (Section 12 & 19).
Verifies that no forbidden CSS or styling patterns exist in the frontend codebase:
- No gradients (gradient(, linear-gradient, radial-gradient)
- No glassmorphism (backdrop-filter)
- No text shadows (text-shadow)
- No blurred drop shadows (box-shadow with blur > 0)
- No pure black (#000, #000000) or pure white (#fff, #ffffff)
"""

import sys
import re
from pathlib import Path

FORBIDDEN_PATTERNS = [
    (r"linear-gradient\(", "Forbidden linear gradient found"),
    (r"radial-gradient\(", "Forbidden radial gradient found"),
    (r"conic-gradient\(", "Forbidden conic gradient found"),
    (r"backdrop-filter", "Forbidden glassmorphism (backdrop-filter) found"),
    (r"text-shadow", "Forbidden text-shadow found"),
    (r"box-shadow:\s*[^;]*\d+px\s+\d+px\s+[1-9]\d*px", "Forbidden blurred box-shadow found (only 0px blur or 1px hairline elevation allowed)"),
    (r"(?<![a-zA-Z0-9_-])#(?:ffffff|fff)(?![a-zA-Z0-9_-])", "Forbidden pure white (#fff/#ffffff) found (use --surface or #F4F1EB)"),
    (r"(?<![a-zA-Z0-9_-])#(?:000000|000)(?![a-zA-Z0-9_-])", "Forbidden pure black (#000/#000000) found (use --text or #2E3033)"),
]

# Files/extensions to inspect
INSPECT_EXTS = {".css", ".scss", ".ts", ".tsx", ".js", ".jsx", ".html"}
EXCLUDE_DIRS = {"node_modules", "dist", ".git", "coverage", ".venv", "mlruns"}

def check_styles(root_dir: Path) -> int:
    frontend_dir = root_dir / "frontend"
    if not frontend_dir.exists():
        print(f"[SKIP] Frontend directory not found at {frontend_dir}")
        return 0

    violations = []
    
    for file_path in frontend_dir.rglob("*"):
        if any(part in file_path.parts for part in EXCLUDE_DIRS):
            continue
        if file_path.suffix not in INSPECT_EXTS:
            continue

        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as e:
            continue

        lines = content.splitlines()
        for idx, line in enumerate(lines, start=1):
            # Allow comments explicitly referencing the prohibition or test assertions
            if "forbidden" in line.lower() or "check_matte_style" in line:
                continue
            for pattern, msg in FORBIDDEN_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append(f"{file_path.relative_to(root_dir)}:{idx}: {msg}\n  Line: {line.strip()}")

    if violations:
        print(f"❌ [MATTE STYLE VIOLATIONS FOUND: {len(violations)}]")
        for v in violations:
            print(f"  - {v}")
        return 1
    else:
        print("✅ [MATTE STYLE CHECK PASSED] All styles strictly adhere to Matte Clay design system rules.")
        return 0

if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    sys.exit(check_styles(root))
