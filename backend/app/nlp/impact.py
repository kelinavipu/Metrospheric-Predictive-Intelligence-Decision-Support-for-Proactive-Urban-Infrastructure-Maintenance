"""
Metrospheric Impact & Safety Flag Extractor
Multi-label detection for civic incident impacts:
- traffic_blocked, water_supply_cut, injury_risk, flooding, property_damage, health_hazard
Safety Flag detection for emergency hazard triggers (live wires, sinkholes, school zones, hospital ambulances).
"""

import re
from typing import List, Dict, Any, Tuple

IMPACT_PATTERNS = {
    "traffic_blocked": [
        r"\b(traffic\s+(?:is\s+|was\s+|severely\s+)?(?:jam(?:med)?|blocked|halted|diverted|gridlock|congestion)|cars\s+(?:are\s+)?(?:stuck|stranded)|vehicles\s+cannot\s+pass|road\s+(?:is\s+)?blocked|lane\s+closed|choked)\b"
    ],
    "water_supply_cut": [
        r"\b(no\s+water|water\s+cut|dry\s+taps|supply\s+stopped|no\s+drinking\s+water|low\s+pressure)\b"
    ],
    "injury_risk": [
        r"\b(accident|tripping|skidding|injured|fall\s+hazard|elderly\s+falling|two\s+wheelers?\s+(?:slipping|falling)|fracture|hurt)\b"
    ],
    "flooding": [
        r"\b(flooding|flooded|water\s+logging|submerged|knee\s+deep|water\s+overflowing|lake\s+on\s+road)\b"
    ],
    "property_damage": [
        r"\b(car\s+damaged|tire\s+puncture|bumper\s+broken|rim\s+bent|vehicle\s+damage|wall\s+collapsed|flooded\s+basement)\b"
    ],
    "health_hazard": [
        r"\b(sewage\s+stench|foul\s+smell|contaminated|mosquitoes|dirty\s+water|black\s+water|stinking|disease|drain\s+filth)\b"
    ]
}

SAFETY_FLAG_PATTERNS = [
    r"\b(live\s+wire|sparking|electric\s+shock|electrocution|short\s+circuit)\b",
    r"\b(sinkhole|road\s+cave\s+in|collapsed|bridge\s+crack|trench\s+open)\b",
    r"\b(hospital\s+emergency|ambulance\s+blocked|fire\s+engine)\b",
    r"\b(school\s+children|kids\s+falling|child\s+danger)\b",
    r"\b(gas\s+leak|cylinder|explosion|fatal|deadly)\b"
]

class ImpactExtractor:
    def extract_impacts(self, text: str, category: str = "", severity: int = 1) -> Tuple[List[str], bool, List[str]]:
        """
        Returns (impact_labels, safety_flag, detected_safety_cues)
        """
        t_low = text.lower()
        impacts: List[str] = []

        # Category based default priors
        if category in ["pipe_burst", "drainage_flooding"]:
            impacts.append("flooding")
        elif category in ["sewer_overflow", "sewer_blockage"]:
            impacts.append("health_hazard")
        elif category in ["signal_malfunction"]:
            impacts.append("traffic_blocked")

        # Pattern based detection
        for impact_label, patterns in IMPACT_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, t_low):
                    if impact_label not in impacts:
                        impacts.append(impact_label)
                    break

        # Safety flag detection
        safety_cues: List[str] = []
        for pat in SAFETY_FLAG_PATTERNS:
            m = re.search(pat, t_low)
            if m:
                safety_cues.append(m.group(0))

        safety_flag = len(safety_cues) > 0 or severity >= 4

        return impacts, safety_flag, safety_cues

impact_extractor = ImpactExtractor()
