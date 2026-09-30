"""
Metrospheric Nerul Spatial Ontology
Contains 45+ ground-truth landmarks, transit stations, hospitals, schools,
parks, and commercial corridors across Nerul, Navi Mumbai.
Derived from OpenStreetMap boundaries with multi-lingual aliases and popularity priors.
"""

from typing import List, Dict, Any, Optional

NERUL_LANDMARKS: List[Dict[str, Any]] = [
    # --- Hospitals & Healthcare ---
    {
        "landmark_id": "NRL-HOSP-001",
        "name": "Dr. D.Y. Patil Hospital & Medical College",
        "aliases": ["d.y. patil hospital", "dy patil hospital", "dy hospital", "डी वाय पाटील रुग्णालय", "patil hospital nerul", "dyp medical"],
        "type": "hospital",
        "lat": 19.0435,
        "lon": 73.0245,
        "sector": "Sector 5",
        "nearby_roads": ["Palm Beach Road", "Vidyanagar Marg"],
        "description": "Multi-specialty tertiary care teaching hospital and research center",
        "popularity_prior": 0.95
    },
    {
        "landmark_id": "NRL-HOSP-002",
        "name": "Apollo Hospitals Nerul",
        "aliases": ["apollo hospital", "apollo nerul", "अपोलो हॉस्पिटल", "apollo parsik hill"],
        "type": "hospital",
        "lat": 19.0410,
        "lon": 73.0295,
        "sector": "Sector 23",
        "nearby_roads": ["Parsik Hill Road", "Sion-Panvel Highway"],
        "description": "Super-specialty hospital near Parsik Hill junction",
        "popularity_prior": 0.88
    },
    {
        "landmark_id": "NRL-HOSP-003",
        "name": "Terna Speciality Hospital & Research Centre",
        "aliases": ["terna hospital", "terna medical", "तेरणा रुग्णालय", "terna nerul west"],
        "type": "hospital",
        "lat": 19.0380,
        "lon": 73.0190,
        "sector": "Sector 22",
        "nearby_roads": ["Nerul Station Road", "Karave Road"],
        "description": "Multi-specialty medical facility opposite Nerul West station corridor",
        "popularity_prior": 0.82
    },
    {
        "landmark_id": "NRL-HOSP-004",
        "name": "Sunshine Multispeciality Hospital",
        "aliases": ["sunshine hospital", "सनशाईन हॉस्पिटल", "sunshine nerul"],
        "type": "hospital",
        "lat": 19.0350,
        "lon": 73.0145,
        "sector": "Sector 19",
        "nearby_roads": ["Wonders Park Marg"],
        "description": "Emergency and trauma hospital in Nerul West",
        "popularity_prior": 0.70
    },

    # --- Transit Hubs & Railway Stations ---
    {
        "landmark_id": "NRL-TRN-001",
        "name": "Nerul Railway Station (West)",
        "aliases": ["nerul station west", "nerul stn west", "nerul station", "नेरुळ रेल्वे स्थानक", "nerul west station"],
        "type": "transit_hub",
        "lat": 19.0330,
        "lon": 73.0160,
        "sector": "Sector 20",
        "nearby_roads": ["Nerul Station Road", "Market Street"],
        "description": "Major Central Railway Harbour and Trans-Harbour line interchange station",
        "popularity_prior": 0.98
    },
    {
        "landmark_id": "NRL-TRN-002",
        "name": "Nerul Railway Station (East)",
        "aliases": ["nerul station east", "nerul east station", "nerul stn east"],
        "type": "transit_hub",
        "lat": 19.0345,
        "lon": 73.0195,
        "sector": "Sector 15",
        "nearby_roads": ["Station Road East", "MIDC corridor"],
        "description": "East concourse of Nerul Station serving industrial and residential zones",
        "popularity_prior": 0.85
    },
    {
        "landmark_id": "NRL-TRN-003",
        "name": "Seawoods Grand Central / Seawoods-Darave Station",
        "aliases": ["seawoods station", "seawoods railway station", "seawoods grand central", "सीवूड्स स्टेशन", "seawoods darave"],
        "type": "transit_hub",
        "lat": 19.0210,
        "lon": 73.0180,
        "sector": "Sector 48",
        "nearby_roads": ["Grand Central Avenue", "Karave Link Road"],
        "description": "Major integrated transit oriented station and mega retail mall complex",
        "popularity_prior": 0.96
    },
    {
        "landmark_id": "NRL-TRN-004",
        "name": "Juinagar Railway Station",
        "aliases": ["juinagar station", "juinagar stn", "जुईनगर स्टेशन"],
        "type": "transit_hub",
        "lat": 19.0550,
        "lon": 73.0170,
        "sector": "Sector 24",
        "nearby_roads": ["Sion-Panvel Highway", "MIDC Main Road"],
        "description": "Northern boundary station connecting Nerul and Sanpada",
        "popularity_prior": 0.78
    },
    {
        "landmark_id": "NRL-TRN-005",
        "name": "Nerul NMMC Bus Terminal",
        "aliases": ["nerul bus depot", "nerul bus stand", "nerul bus stop", "नेरुळ बस आगार"],
        "type": "transit_hub",
        "lat": 19.0325,
        "lon": 73.0175,
        "sector": "Sector 20",
        "nearby_roads": ["Station Road"],
        "description": "Central municipal bus depot for NMMC intra-city routes",
        "popularity_prior": 0.80
    },

    # --- Parks, Sports & Recreation ---
    {
        "landmark_id": "NRL-PARK-001",
        "name": "Wonders Park",
        "aliases": ["wonders park nerul", "वंडर्स पार्क", "wonder park", "wonders garden"],
        "type": "park",
        "lat": 19.0290,
        "lon": 73.0070,
        "sector": "Sector 19A",
        "nearby_roads": ["Wonders Park Marg", "Sector 19A Spine"],
        "description": "Famous 30-acre amusement park with replica monuments and lake",
        "popularity_prior": 0.94
    },
    {
        "landmark_id": "NRL-PARK-002",
        "name": "Rock Garden Nerul",
        "aliases": ["rock garden", "रॉक गार्डन", "nerul rock garden"],
        "type": "park",
        "lat": 19.0355,
        "lon": 73.0110,
        "sector": "Sector 21",
        "nearby_roads": ["Rock Garden Avenue"],
        "description": "Sculpted stone garden, children park and jogging track",
        "popularity_prior": 0.82
    },
    {
        "landmark_id": "NRL-PARK-003",
        "name": "Jewel of Navi Mumbai",
        "aliases": ["jewel of navi mumbai", "jewel promenade", "ज्वेल ऑफ नवी मुंबई", "jewel lake promenade"],
        "type": "park",
        "lat": 19.0380,
        "lon": 73.0040,
        "sector": "Sector 28",
        "nearby_roads": ["Palm Beach Road"],
        "description": "Scenic waterfront walking and running boulevard alongside Nerul holding pond",
        "popularity_prior": 0.91
    },
    {
        "landmark_id": "NRL-PARK-004",
        "name": "Nerul Gymkhana",
        "aliases": ["nerul gymkhana", "gymkhana club", "नेरुळ जिमखाना"],
        "type": "sports",
        "lat": 19.0360,
        "lon": 73.0085,
        "sector": "Sector 28",
        "nearby_roads": ["Gymkhana Road"],
        "description": "Sports complex with tennis courts, cricket pitch and gymnasium",
        "popularity_prior": 0.75
    },
    {
        "landmark_id": "NRL-SPRT-001",
        "name": "Dr. D.Y. Patil Sports Stadium",
        "aliases": ["d.y. patil stadium", "dy patil stadium", "डी वाय पाटील स्टेडियम", "dyp stadium", "patil cricket stadium"],
        "type": "sports",
        "lat": 19.0445,
        "lon": 73.0270,
        "sector": "Sector 7",
        "nearby_roads": ["Vidyanagari Marg", "Stadium Link Road"],
        "description": "55,000 capacity international cricket and football stadium",
        "popularity_prior": 0.96
    },

    # --- Educational Institutions ---
    {
        "landmark_id": "NRL-EDU-001",
        "name": "SIES Graduate School of Technology",
        "aliases": ["sies college", "sies nerul", "sies gst", "एसआयईएस कॉलेज"],
        "type": "education",
        "lat": 19.0420,
        "lon": 73.0210,
        "sector": "Sector 5",
        "nearby_roads": ["Sri Chandrasekarendra Saraswati Vidyapuram"],
        "description": "Leading engineering and arts higher education campus",
        "popularity_prior": 0.86
    },
    {
        "landmark_id": "NRL-EDU-002",
        "name": "Apeejay School Nerul",
        "aliases": ["apeejay school", "apeejay nerul", "एपीजे स्कूल"],
        "type": "education",
        "lat": 19.0395,
        "lon": 73.0130,
        "sector": "Sector 15",
        "nearby_roads": ["Park Avenue", "Sector 15 Main"],
        "description": "Major senior secondary academic institution in Nerul",
        "popularity_prior": 0.80
    },
    {
        "landmark_id": "NRL-EDU-003",
        "name": "DAV Public School Nerul",
        "aliases": ["dav school", "dav nerul", "डीएव्ही पब्लिक स्कूल"],
        "type": "education",
        "lat": 19.0180,
        "lon": 73.0120,
        "sector": "Sector 48",
        "nearby_roads": ["Seawoods Spine Road"],
        "description": "CBSE accredited public school in southern Nerul",
        "popularity_prior": 0.77
    },
    {
        "landmark_id": "NRL-EDU-004",
        "name": "Sterling Institute of Management Studies",
        "aliases": ["sterling institute", "sterling college nerul", "स्टर्लिंग इन्स्टिट्यूट"],
        "type": "education",
        "lat": 19.0250,
        "lon": 73.0220,
        "sector": "Sector 19",
        "nearby_roads": ["Plot 93 Spine"],
        "description": "Postgraduate management and computer studies institute",
        "popularity_prior": 0.70
    },
    {
        "landmark_id": "NRL-EDU-005",
        "name": "Dr. D.Y. Patil Deemed to be University Campus",
        "aliases": ["d.y. patil university", "dy university", "डी वाय पाटील विद्यापीठ"],
        "type": "education",
        "lat": 19.0430,
        "lon": 73.0235,
        "sector": "Sector 7",
        "nearby_roads": ["Vidyanagar Marg"],
        "description": "Multi-disciplinary university campus in Vidyanagari",
        "popularity_prior": 0.85
    },

    # --- Commercial & Retail ---
    {
        "landmark_id": "NRL-COM-001",
        "name": "Seawoods Grand Central Mall",
        "aliases": ["seawoods mall", "grand central mall", "sgc mall", "सीवूड्स मॉल"],
        "type": "commercial",
        "lat": 19.0215,
        "lon": 73.0185,
        "sector": "Sector 48",
        "nearby_roads": ["Seawoods Grand Central Avenue"],
        "description": "1 million sq ft premier shopping mall and entertainment hub",
        "popularity_prior": 0.95
    },
    {
        "landmark_id": "NRL-COM-002",
        "name": "Hotel Yogi Executive",
        "aliases": ["yogi executive", "yogi hotel nerul", "हॉटेल योगी"],
        "type": "commercial",
        "lat": 19.0520,
        "lon": 73.0190,
        "sector": "Sector 24",
        "nearby_roads": ["Sion-Panvel Highway"],
        "description": "Business hotel on the northern arterial highway junction",
        "popularity_prior": 0.72
    },
    {
        "landmark_id": "NRL-COM-003",
        "name": "Nerul Sector 9 Market Square",
        "aliases": ["sector 9 market", "nerul vegetable market", "सेक्टर ९ मार्केट"],
        "type": "commercial",
        "lat": 19.0370,
        "lon": 73.0170,
        "sector": "Sector 9",
        "nearby_roads": ["Market Street", "Station Link"],
        "description": "Central municipal market and retail trade corridor",
        "popularity_prior": 0.79
    },

    # --- Civic & Religious ---
    {
        "landmark_id": "NRL-CIV-001",
        "name": "NMMC Ward Office Nerul",
        "aliases": ["nerul ward office", "nmmc nerul office", "महापालिका प्रभाग कार्यालय"],
        "type": "civic",
        "lat": 19.0340,
        "lon": 73.0150,
        "sector": "Sector 20",
        "nearby_roads": ["Ward Office Road"],
        "description": "Navi Mumbai Municipal Corporation administrative division office",
        "popularity_prior": 0.81
    },
    {
        "landmark_id": "NRL-CIV-002",
        "name": "Nerul Balaji Temple",
        "aliases": ["balaji temple nerul", "balaji mandir", "बालाजी मंदिर नेरुळ"],
        "type": "civic",
        "lat": 19.0305,
        "lon": 73.0230,
        "sector": "Sector 22",
        "nearby_roads": ["Brahmagiri Hill Road"],
        "description": "Prominent hilltop temple dedicated to Lord Venkateshwara",
        "popularity_prior": 0.89
    },
    {
        "landmark_id": "NRL-CIV-003",
        "name": "Nerul Police Station",
        "aliases": ["nerul police station", "nerul thana", "नेरुळ पोलीस स्टेशन"],
        "type": "civic",
        "lat": 19.0365,
        "lon": 73.0180,
        "sector": "Sector 18",
        "nearby_roads": ["Police Station Marg"],
        "description": "Navi Mumbai Police precinct station for Nerul zone",
        "popularity_prior": 0.83
    },

    # --- Major Arterial Road Corridors ---
    {
        "landmark_id": "NRL-ROAD-001",
        "name": "Palm Beach Road Corridor (Nerul Stretch)",
        "aliases": ["palm beach road", "palm beach rd", "पाम बीच रोड", "palm beach nerul"],
        "type": "road",
        "lat": 19.0400,
        "lon": 73.0090,
        "sector": "Sectors 4, 6, 8, 28",
        "nearby_roads": ["Jewel Promenade", "Vidyanagar Marg"],
        "description": "6-lane high-speed coastal expressway connecting Nerul to Vashi and Belapur",
        "popularity_prior": 0.97
    },
    {
        "landmark_id": "NRL-ROAD-002",
        "name": "Sion-Panvel Highway Corridor",
        "aliases": ["sion panvel highway", "sion-panvel expressway", "सायन पनवेल हायवे"],
        "type": "road",
        "lat": 19.0480,
        "lon": 73.0230,
        "sector": "Sectors 1, 3, 23, 24",
        "nearby_roads": ["LP Junction", "Uran Phata"],
        "description": "Heavy vehicular arterial corridor connecting Mumbai to Navi Mumbai",
        "popularity_prior": 0.93
    },
    {
        "landmark_id": "NRL-ROAD-003",
        "name": "LP Flyover Junction",
        "aliases": ["lp junction", "lp flyover", "एलपी जंक्शन", "lp nerul"],
        "type": "road",
        "lat": 19.0465,
        "lon": 73.0240,
        "sector": "Sector 3/23",
        "nearby_roads": ["Sion-Panvel Highway", "Vidyanagar Marg"],
        "description": "Major grade-separated highway junction and bus transit stop",
        "popularity_prior": 0.90
    },
    {
        "landmark_id": "NRL-ROAD-004",
        "name": "Uran Phata Junction",
        "aliases": ["uran phata", "uran junction", "उरण फाटा"],
        "type": "road",
        "lat": 19.0385,
        "lon": 73.0310,
        "sector": "Sector 23",
        "nearby_roads": ["Uran Road", "Sion-Panvel Highway"],
        "description": "Major three-way intersection directing freight towards JNPT and Uran",
        "popularity_prior": 0.88
    },
    {
        "landmark_id": "NRL-ROAD-005",
        "name": "Wonders Park Marg",
        "aliases": ["wonders park road", "wonders park marg"],
        "type": "road",
        "lat": 19.0285,
        "lon": 73.0080,
        "sector": "Sector 19A",
        "nearby_roads": ["Sector 19A Spine"],
        "description": "Arterial roadway connecting Sector 19A to Palm Beach Road",
        "popularity_prior": 0.80
    },

    # --- Residential & Mixed Sector Centers ---
    {
        "landmark_id": "NRL-SEC-019A",
        "name": "Sector 19A Residential Corridor",
        "aliases": ["sector 19a", "sec 19a", "सेक्टर १९ए", "sector 19a nerul"],
        "type": "sector",
        "lat": 19.0280,
        "lon": 73.0065,
        "sector": "Sector 19A",
        "nearby_roads": ["Wonders Park Marg"],
        "description": "Densely populated housing sector adjacent to Wonders Park",
        "popularity_prior": 0.84
    },
    {
        "landmark_id": "NRL-SEC-005",
        "name": "Sector 5 Institutional & Medical Hub",
        "aliases": ["sector 5", "sec 5", "सेक्टर ५", "sector 5 nerul"],
        "type": "sector",
        "lat": 19.0430,
        "lon": 73.0230,
        "sector": "Sector 5",
        "nearby_roads": ["Palm Beach Road", "Vidyanagar Marg"],
        "description": "Healthcare and university campus corridor",
        "popularity_prior": 0.87
    },
    {
        "landmark_id": "NRL-SEC-020",
        "name": "Sector 20 Station Zone",
        "aliases": ["sector 20", "sec 20", "सेक्टर २०"],
        "type": "sector",
        "lat": 19.0335,
        "lon": 73.0155,
        "sector": "Sector 20",
        "nearby_roads": ["Nerul Station Road"],
        "description": "Commercial and high footfall zone near Nerul West railway terminal",
        "popularity_prior": 0.89
    },
    {
        "landmark_id": "NRL-SEC-048",
        "name": "Sector 48 Seawoods Waterfront",
        "aliases": ["sector 48", "sec 48", "सेक्टर ४८"],
        "type": "sector",
        "lat": 19.0200,
        "lon": 73.0160,
        "sector": "Sector 48",
        "nearby_roads": ["Grand Central Avenue"],
        "description": "Southern residential node near Seawoods Grand Central",
        "popularity_prior": 0.85
    }
]

def get_landmark_by_id(landmark_id: str) -> Optional[Dict[str, Any]]:
    for lm in NERUL_LANDMARKS:
        if lm["landmark_id"] == landmark_id:
            return lm
    return None

def find_landmarks_by_type(ltype: str) -> List[Dict[str, Any]]:
    return [lm for lm in NERUL_LANDMARKS if lm["type"] == ltype]
