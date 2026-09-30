"""
Metrospheric Anaphora & Coreference Resolution Engine
Resolves:
1. Pronominal Anaphora: "it", "they", "this", "that" -> preceding Defect / Infrastructure Asset
2. Locative Anaphora: "there", "here", "at that spot", "in that area" -> preceding Landmark / Spatial Entity
Produces:
- resolved_text: Enriched representation with antecedents explicitly linked
- anaphora_chains: List of {pronoun, antecedent, antecedent_type, confidence}
"""

import re
from typing import List, Dict, Any, Tuple
from backend.app.nlp.ontology import NERUL_LANDMARKS

# Pronouns indicating defects or assets
PRONOMINAL_DEFECT_PATTERNS = [
    r"\b(it|this|that)\b",
    r"\b(they|these|those)\b"
]

# Locative expressions indicating places or spots
LOCATIVE_PATTERNS = [
    r"\b(there|here)\b",
    r"\b(at that spot|in that area|around there|near there|at this place)\b"
]

DEFECT_CANDIDATE_KEYWORDS = [
    "pipe burst", "water leak", "water pipe", "pipeline", "pothole", "crater",
    "street light", "streetlight", "signal", "traffic light", "sewer", "drain",
    "manhole", "footpath", "sidewalk", "cable", "wire", "sinkhole", "road damage"
]

class AnaphoraResolver:
    def __init__(self):
        self.defect_kw = DEFECT_CANDIDATE_KEYWORDS
        self.landmarks = NERUL_LANDMARKS

    def extract_antecedents(self, text: str) -> Tuple[List[str], List[str]]:
        """Extracts candidate defects and candidate landmarks from text."""
        t_low = text.lower()
        defects: List[str] = []
        places: List[str] = []

        # Find defect phrases
        for kw in self.defect_kw:
            if kw in t_low:
                # expand slightly to capture adjectives like "huge pothole" or "major pipe burst"
                match = re.search(rf"\b(?:major|huge|deep|severe|broken|leaking|damaged)?\s*{re.escape(kw)}\b", t_low)
                if match:
                    defects.append(match.group(0).strip())
                else:
                    defects.append(kw)

        # Find place phrases from ontology & common indicators
        for lm in self.landmarks:
            if lm["name"].lower() in t_low:
                places.append(lm["name"])
            else:
                for alias in lm["aliases"]:
                    if alias.lower() in t_low:
                        places.append(lm["name"])
                        break

        # Also check for street / landmark cues like "palm beach road", "station"
        for generic_loc in ["palm beach road", "station road", "wonders park", "railway station", "vidyanagar marg"]:
            if generic_loc in t_low and not any(generic_loc in p.lower() for p in places):
                places.append(generic_loc.title())

        return defects, places

    def resolve(self, text: str) -> Dict[str, Any]:
        """
        Performs anaphora resolution across sentences or clauses.
        Returns resolved_text and extracted coreference chains.
        """
        # Protect abbreviations before splitting
        p = re.sub(r"\b(Dr|Prof|Mr|Mrs|Ms|St|Sec|Rd|Stn)\.", r"\1<DOT>", text, flags=re.IGNORECASE)
        p = re.sub(r"(?<=\b[A-Za-z])\.", "<DOT>", p)
        raw_clauses = [c.replace("<DOT>", ".").strip() for c in re.split(r"(?:[!?;\n]|\.(?:\s+|$)|(?<=,)\s*(?:and|but|where)\s+)", p) if c.strip()]
        
        chains: List[Dict[str, Any]] = []
        resolved_clauses: List[str] = []
        
        # Track historical antecedents
        current_defects: List[str] = []
        current_places: List[str] = []

        for i, clause in enumerate(raw_clauses):
            c_low = clause.lower()
            new_clause = clause

            # Check if current clause introduces new antecedents
            d_found, p_found = self.extract_antecedents(clause)
            if d_found:
                current_defects = d_found + current_defects
            if p_found:
                current_places = p_found + current_places

            # 1. Check pronominal anaphora (it, they, this)
            if current_defects:
                primary_defect = current_defects[0]
                for pat in PRONOMINAL_DEFECT_PATTERNS:
                    matches = list(re.finditer(pat, clause, re.IGNORECASE))
                    for m in matches:
                        pronoun = m.group(0)
                        # Verify not dummy "it" like "it is 4pm" or "it seems"
                        post_text = clause[m.end():].strip().lower()
                        if post_text.startswith("is raining") or post_text.startswith("seems"):
                            continue
                        
                        chains.append({
                            "pronoun": pronoun,
                            "antecedent": primary_defect,
                            "antecedent_type": "defect_asset",
                            "confidence": 0.92
                        })
                        # Replace for resolved_text
                        new_clause = re.sub(rf"\b{re.escape(pronoun)}\b", f"[{primary_defect}]", new_clause, count=1, flags=re.IGNORECASE)

            # 2. Check locative anaphora (there, here, in that area)
            if current_places:
                primary_place = current_places[0]
                for pat in LOCATIVE_PATTERNS:
                    matches = list(re.finditer(pat, clause, re.IGNORECASE))
                    for m in matches:
                        loc_phrase = m.group(0)
                        chains.append({
                            "pronoun": loc_phrase,
                            "antecedent": primary_place,
                            "antecedent_type": "landmark_location",
                            "confidence": 0.89
                        })
                        # Replace for resolved_text
                        new_clause = re.sub(rf"\b{re.escape(loc_phrase)}\b", f"[at {primary_place}]", new_clause, count=1, flags=re.IGNORECASE)

            resolved_clauses.append(new_clause)

        resolved_text = " ".join(resolved_clauses)
        # Clean up repeated spacing
        resolved_text = re.sub(r"\s+([.!?;,])", r"\1", resolved_text)
        resolved_text = re.sub(r"\s+", " ", resolved_text).strip()

        return {
            "original_text": text,
            "resolved_text": resolved_text,
            "has_anaphora": len(chains) > 0,
            "anaphora_chains": chains
        }

anaphora_resolver = AnaphoraResolver()
