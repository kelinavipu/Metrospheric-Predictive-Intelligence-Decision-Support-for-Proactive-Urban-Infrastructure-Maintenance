"""
Metrospheric Time Expression Normalizer
Normalizes colloquial civic time expressions against incident received_at timestamp.
"""

import re
import datetime
from typing import Dict, Any, Optional

TIME_PATTERNS = [
    (r"\b(since\s+morning|this\s+morning)\b", lambda ref: ref.replace(hour=8, minute=0, second=0)),
    (r"\b(this\s+afternoon)\b", lambda ref: ref.replace(hour=14, minute=0, second=0)),
    (r"\b(this\s+evening)\b", lambda ref: ref.replace(hour=19, minute=0, second=0)),
    (r"\b(last\s+night|yesterday\s+night)\b", lambda ref: (ref - datetime.timedelta(days=1)).replace(hour=21, minute=0, second=0)),
    (r"\b(yesterday)\b", lambda ref: (ref - datetime.timedelta(days=1)).replace(hour=12, minute=0, second=0)),
    (r"\b(day\s+before\s+yesterday)\b", lambda ref: (ref - datetime.timedelta(days=2)).replace(hour=12, minute=0, second=0)),
    (r"\b(last\s+week)\b", lambda ref: (ref - datetime.timedelta(days=7)).replace(hour=12, minute=0, second=0)),
    (r"\b(?:for|since)\s+(\d+)\s+hours?\b", lambda ref, h: ref - datetime.timedelta(hours=int(h))),
    (r"\b(?:for|since)\s+(\d+)\s+days?\b", lambda ref, d: ref - datetime.timedelta(days=int(d))),
    (r"\b(?:for|since)\s+(\d+)\s+weeks?\b", lambda ref, w: ref - datetime.timedelta(weeks=int(w))),
    (r"\b(just\s+now|recently|few\s+minutes\s+ago)\b", lambda ref: ref - datetime.timedelta(minutes=15))
]

class TimeNormalizer:
    def normalize(self, text: str, received_at: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        ref = received_at or datetime.datetime.now(datetime.timezone.utc)
        t_low = text.lower()

        for pat, fn in TIME_PATTERNS:
            m = re.search(pat, t_low)
            if m:
                matched_span = m.group(0)
                try:
                    if len(m.groups()) == 1 and m.group(1).isdigit():
                        dt = fn(ref, m.group(1))
                    else:
                        dt = fn(ref)
                    return {
                        "has_time": True,
                        "raw_expression": matched_span,
                        "normalized_iso": dt.isoformat(),
                        "confidence": 0.95
                    }
                except Exception:
                    pass

        return {
            "has_time": False,
            "raw_expression": None,
            "normalized_iso": ref.isoformat(),
            "confidence": 0.50
        }

time_normalizer = TimeNormalizer()
