"""
UrbanPulse NLP Preprocessor
PII scrubbing, typo normalization, and abbreviation expansion.
"""

import re
from typing import Tuple

ABBREVIATIONS = {
    r"\brd\b": "road",
    r"\bst\b": "street",
    r"\bave\b": "avenue",
    r"\bblvd\b": "boulevard",
    r"\bln\b": "lane",
    r"\bdr\b": "drive",
    r"\bhosp\b": "hospital",
    r"\bpot\s*hole\b": "pothole",
    r"\bmh\b": "manhole",
    r"\bsig\b": "signal",
    r"\bsew\b": "sewer",
    r"\bwtr\b": "water",
    r"\bpress\b": "pressure",
}

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")

def scrub_pii(text: str) -> str:
    """Mask email addresses and phone numbers with tokens."""
    scrubbed = EMAIL_REGEX.sub("[EMAIL_REDACTED]", text)
    scrubbed = PHONE_REGEX.sub("[PHONE_REDACTED]", scrubbed)
    return scrubbed

def normalize_text(text: str) -> str:
    """Normalize whitespace, lowercase, and expand abbreviations."""
    clean = text.strip()
    clean = scrub_pii(clean)
    
    # Expand abbreviations
    for pattern, replacement in ABBREVIATIONS.items():
        clean = re.sub(pattern, replacement, clean, flags=re.IGNORECASE)
        
    return clean
