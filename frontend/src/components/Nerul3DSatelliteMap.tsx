import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Compass,
  Crosshair,
  Building2,
  Droplets,
  School,
  Hotel,
  Activity,
  RotateCw,
  Maximize2,
  MapPin,
  Car
} from "lucide-react";

interface NerulPOIFeature {
  id: string;
  name: string;
  category: "hospital" | "school" | "hotel" | "park" | "transit" | "commercial" | "infrastructure";
  sector: string;
  lat: number;
  lon: number;
  height: number;
  ahi: number;
  riskBand: "critical" | "high" | "moderate" | "low";
  description: string;
  footprint: [number, number][];
}

const NERUL_3D_LANDMARKS: NerulPOIFeature[] = [
  {
    id: "DY-PATIL-HOSP",
    name: "Dr. D.Y. Patil Hospital & Medical College",
    category: "hospital",
    sector: "Sector 5",
    lat: 19.0435,
    lon: 73.0245,
    height: 48,
    ahi: 88.5,
    riskBand: "low",
    description: "1,500-bed multi-specialty tertiary teaching hospital and emergency medical trauma center.",
    footprint: [
      [73.0238, 19.0428],
      [73.0252, 19.0428],
      [73.0252, 19.0442],
      [73.0238, 19.0442],
      [73.0238, 19.0428]
    ]
  },
  {
    id: "DY-PATIL-STADIUM",
    name: "Dr. D.Y. Patil Sports Stadium",
    category: "commercial",
    sector: "Sector 7",
    lat: 19.0445,
    lon: 73.0270,
    height: 38,
    ahi: 94.2,
    riskBand: "low",
    description: "International 55,000-seat cricket and football stadium with cantilevered roof structure.",
    footprint: [
      [73.0258, 19.0435],
      [73.0282, 19.0435],
      [73.0282, 19.0455],
      [73.0258, 19.0455],
      [73.0258, 19.0435]
    ]
  },
  {
    id: "APOLLO-HOSP",
    name: "Apollo Hospitals Nerul",
    category: "hospital",
    sector: "Sector 23",
    lat: 19.0410,
    lon: 73.0295,
    height: 42,
    ahi: 91.0,
    riskBand: "low",
    description: "500-bed quaternary care hospital with 24/7 cardiac emergency and pediatric trauma center.",
    footprint: [
      [73.0288, 19.0403],
      [73.0302, 19.0403],
      [73.0302, 19.0417],
      [73.0288, 19.0417],
      [73.0288, 19.0403]
    ]
  },
  {
    id: "TERNA-HOSP",
    name: "Terna Speciality Hospital & Research Centre",
    category: "hospital",
    sector: "Sector 22",
    lat: 19.0380,
    lon: 73.0190,
    height: 36,
    ahi: 79.4,
    riskBand: "moderate",
    description: "400-bed multi-specialty hospital adjacent to Terna Medical & Engineering College.",
    footprint: [
      [73.0182, 19.0373],
      [73.0198, 19.0373],
      [73.0198, 19.0387],
      [73.0182, 19.0387],
      [73.0182, 19.0373]
    ]
  },
  {
    id: "SIES-GST",
    name: "SIES Graduate School of Technology",
    category: "school",
    sector: "Sector 5",
    lat: 19.0420,
    lon: 73.0220,
    height: 28,
    ahi: 85.0,
    riskBand: "low",
    description: "Premier engineering and technical research campus spanning 6 acres in Vidyanagari.",
    footprint: [
      [73.0212, 19.0414],
      [73.0228, 19.0414],
      [73.0228, 19.0426],
      [73.0212, 19.0426],
      [73.0212, 19.0414]
    ]
  },
  {
    id: "APEEJAY-NERUL",
    name: "Apeejay School Nerul",
    category: "school",
    sector: "Sector 15",
    lat: 19.0355,
    lon: 73.0115,
    height: 22,
    ahi: 82.5,
    riskBand: "low",
    description: "Renowned academic institution and athletic grounds near Nerul West corridor.",
    footprint: [
      [73.0107, 19.0348],
      [73.0123, 19.0348],
      [73.0123, 19.0362],
      [73.0107, 19.0362],
      [73.0107, 19.0348]
    ]
  },
  {
    id: "DAV-SEAWOODS",
    name: "DAV Public School Seawoods",
    category: "school",
    sector: "Sector 48",
    lat: 19.0185,
    lon: 73.0150,
    height: 20,
    ahi: 87.0,
    riskBand: "low",
    description: "Senior secondary educational campus serving Seawoods and Karave communities.",
    footprint: [
      [73.0142, 19.0178],
      [73.0158, 19.0178],
      [73.0158, 19.0192],
      [73.0142, 19.0192],
      [73.0142, 19.0178]
    ]
  },
  {
    id: "HOTEL-YOGI",
    name: "Hotel Yogi Executive",
    category: "hotel",
    sector: "Sector 24",
    lat: 19.0450,
    lon: 73.0290,
    height: 40,
    ahi: 86.4,
    riskBand: "low",
    description: "4-star business hotel and convention venue on the Sion-Panvel Highway corridor.",
    footprint: [
      [73.0283, 19.0443],
      [73.0297, 19.0443],
      [73.0297, 19.0457],
      [73.0283, 19.0457],
      [73.0283, 19.0443]
    ]
  },
  {
    id: "THE-PARK-HOTEL",
    name: "The Park Navi Mumbai",
    category: "hotel",
    sector: "Sector 10",
    lat: 19.0190,
    lon: 73.0230,
    height: 38,
    ahi: 89.0,
    riskBand: "low",
    description: "Luxury 5-star boutique hospitality destination overlooking the Parsik range.",
    footprint: [
      [73.0223, 19.0183],
      [73.0237, 19.0183],
      [73.0237, 19.0197],
      [73.0223, 19.0197],
      [73.0223, 19.0183]
    ]
  },
  {
    id: "SEAWOODS-GRAND-CENTRAL",
    name: "Seawoods Grand Central Mall & Towers",
    category: "commercial",
    sector: "Sector 48",
    lat: 19.0210,
    lon: 73.0180,
    height: 65,
    ahi: 92.0,
    riskBand: "low",
    description: "Transit-oriented development with 1M sq ft retail mall and four 14-storey office towers.",
    footprint: [
      [73.0168, 19.0198],
      [73.0192, 19.0198],
      [73.0192, 19.0222],
      [73.0168, 19.0222],
      [73.0168, 19.0198]
    ]
  },
  {
    id: "WONDERS-PARK",
    name: "Wonders Park",
    category: "park",
    sector: "Sector 19A",
    lat: 19.0290,
    lon: 73.0070,
    height: 30,
    ahi: 78.0,
    riskBand: "moderate",
    description: "30-acre theme park featuring scale Seven Wonders replicas, artificial lake, and toy train.",
    footprint: [
      [73.0055, 19.0275],
      [73.0085, 19.0275],
      [73.0085, 19.0305],
      [73.0055, 19.0305],
      [73.0055, 19.0275]
    ]
  },
  {
    id: "ROCK-GARDEN",
    name: "Rock Garden Nerul",
    category: "park",
    sector: "Sector 19A",
    lat: 19.0310,
    lon: 73.0085,
    height: 18,
    ahi: 75.5,
    riskBand: "moderate",
    description: "Landscaped recreational botanic park with rocky terraces and outdoor amphitheatre.",
    footprint: [
      [73.0075, 19.0300],
      [73.0095, 19.0300],
      [73.0095, 19.0320],
      [73.0075, 19.0320],
      [73.0075, 19.0300]
    ]
  },
  {
    id: "JEWEL-OF-NAVI-MUMBAI",
    name: "Jewel of Navi Mumbai",
    category: "park",
    sector: "Sector 28",
    lat: 19.0380,
    lon: 73.0040,
    height: 14,
    ahi: 72.0,
    riskBand: "moderate",
    description: "2.6 km continuous jogging promenade surrounding a 25-hectare coastal holding reservoir on Palm Beach Rd.",
    footprint: [
      [73.0022, 19.0360],
      [73.0058, 19.0360],
      [73.0058, 19.0400],
      [73.0022, 19.0400],
      [73.0022, 19.0360]
    ]
  },
  {
    id: "NERUL-STATION",
    name: "Nerul Railway Station Hub",
    category: "transit",
    sector: "Sector 20",
    lat: 19.0335,
    lon: 73.0165,
    height: 26,
    ahi: 81.0,
    riskBand: "low",
    description: "Key junction on Harbour, Trans-Harbour, and Uran railway lines with elevated skywalks.",
    footprint: [
      [73.0152, 19.0322],
      [73.0178, 19.0322],
      [73.0178, 19.0348],
      [73.0152, 19.0348],
      [73.0152, 19.0322]
    ]
  },
  {
    id: "WM-0042",
    name: "MG Road Water Main (Section 42 - Opp City Hospital)",
    category: "infrastructure",
    sector: "Sector 20",
    lat: 19.0330,
    lon: 73.0160,
    height: 10,
    ahi: 34.2,
    riskBand: "critical",
    description: "600mm cast iron main installed 1964. Acoustic hydrophone detected active subsurface leak.",
    footprint: [
      [73.0155, 19.0326],
      [73.0168, 19.0326],
      [73.0168, 19.0334],
      [73.0155, 19.0334],
      [73.0155, 19.0326]
    ]
  }
];

const NERUL_CORRIDORS = [
  {
    name: "Palm Beach Road (Express Corridor)",
    type: "arterial",
    coords: [
      [72.9995, 19.0150],
      [73.0018, 19.0220],
      [73.0035, 19.0310],
      [73.0050, 19.0410],
      [73.0075, 19.0550]
    ],
    lanes: 6,
    status: "good"
  },
  {
    name: "Sion-Panvel Highway (NH 348 Spur)",
    type: "highway",
    coords: [
      [73.0295, 19.0150],
      [73.0305, 19.0250],
      [73.0315, 19.0350],
      [73.0325, 19.0450],
      [73.0335, 19.0550]
    ],
    lanes: 8,
    status: "heavy_traffic"
  },
  {
    name: "Uran Road / Nerul Central Spine",
    type: "arterial",
    coords: [
      [73.0160, 19.0150],
      [73.0165, 19.0250],
      [73.0170, 19.0335],
      [73.0175, 19.0430],
      [73.0180, 19.0550]
    ],
    lanes: 4,
    status: "good"
  },
  {
    name: "Sector 19A Wonders Park Marg",
    type: "path",
    coords: [
      [73.0040, 19.0300],
      [73.0090, 19.0300],
      [73.0165, 19.0300]
    ],
    lanes: 2,
    status: "good"
  },
  {
    name: "Palm Beach Coastal Water Trunk Pipeline",
    type: "water_main",
    coords: [
      [73.0010, 19.0180],
      [73.0030, 19.0280],
      [73.0045, 19.0380],
      [73.0065, 19.0520]
    ],
    lanes: 1,
    status: "monitored"
  }
];

export const Nerul3DSatelliteMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [selectedPOI, setSelectedPOI] = useState<NerulPOIFeature | null>(NERUL_3D_LANDMARKS[0]);
  const [pitchMode, setPitchMode] = useState<"3d" | "2d">("3d");
  const [activeLayers, setActiveLayers] = useState({
    buildings3D: true,
    roadsCorridors: true
  });

  const [cameraStats, setCameraStats] = useState({
    lat: 19.0330,
    lon: 73.0160,
    zoom: 14.2,
    pitch: 56,
    bearing: -18
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],
            tileSize: 256,
            attribution: "ESRI World Imagery"
          },
          "nerul-buildings": {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: NERUL_3D_LANDMARKS.map(p => ({
                type: "Feature",
                properties: {
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  height: p.height,
                  riskBand: p.riskBand,
                  color:
                    p.riskBand === "critical"
                      ? "#A0484A"
                      : p.riskBand === "high"
                      ? "#C27B54"
                      : p.riskBand === "moderate"
                      ? "#C9A45C"
                      : "#5F7A6F"
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [p.footprint]
                }
              }))
            }
          },
          "nerul-corridors": {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: NERUL_CORRIDORS.map((c, idx) => ({
                type: "Feature",
                properties: {
                  id: "corridor-" + idx,
                  name: c.name,
                  type: c.type,
                  color: c.type === "water_main" ? "#66808F" : c.type === "highway" ? "#C27B54" : "#E3DED5"
                },
                geometry: {
                  type: "LineString",
                  coordinates: c.coords
                }
              }))
            }
          }
        },
        layers: [
          {
            id: "satellite-base",
            type: "raster",
            source: "esri-satellite",
            minzoom: 0,
            maxzoom: 20
          },
          {
            id: "corridor-lines",
            type: "line",
            source: "nerul-corridors",
            paint: {
              "line-color": ["get", "color"],
              "line-width": 4,
              "line-opacity": 0.85
            }
          },
          {
            id: "buildings-3d",
            type: "fill-extrusion",
            source: "nerul-buildings",
            paint: {
              "fill-extrusion-color": ["get", "color"],
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.90
            }
          }
        ]
      },
      center: [73.0160, 19.0330],
      zoom: 14.2,
      pitch: 56,
      bearing: -18,
      maxPitch: 80
    });

    mapRef.current = map;

    map.on("move", () => {
      const c = map.getCenter();
      setCameraStats({
        lat: Number(c.lat.toFixed(4)),
        lon: Number(c.lng.toFixed(4)),
        zoom: Number(map.getZoom().toFixed(1)),
        pitch: Math.round(map.getPitch()),
        bearing: Math.round(map.getBearing())
      });
    });

    map.on("click", "buildings-3d", (e) => {
      if (e.features && e.features[0]) {
        const id = e.features[0].properties?.id;
        const poi = NERUL_3D_LANDMARKS.find(item => item.id === id);
        if (poi) {
          setSelectedPOI(poi);
        }
      }
    });

    map.on("mouseenter", "buildings-3d", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "buildings-3d", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
    };
  }, []);

  const jumpToLocation = (lon: number, lat: number, pitch = 60, bearing = -20, zoom = 16.5) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [lon, lat],
      pitch,
      bearing,
      zoom,
      duration: 1800,
      essential: true
    });
  };

  const togglePitchMode = () => {
    if (!mapRef.current) return;
    if (pitchMode === "3d") {
      mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      setPitchMode("2d");
    } else {
      mapRef.current.easeTo({ pitch: 58, bearing: -18, duration: 800 });
      setPitchMode("3d");
    }
  };

  const resetToNerulCenter = () => {
    jumpToLocation(73.0160, 19.0330, 56, -18, 14.2);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Top Banner: Nerul 3D Satellite Scanner Header */}
      <div
        className="card-matte"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--surface)"
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Nerul Node 3D Satellite Scanner</span>
              <span className="badge-risk badge-risk-low" style={{ fontSize: "10px" }}>LIVE GIS 19.0330° N, 73.0160° E</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Photorealistic ESRI World Satellite Imagery · 3D Extruded Building Polygons · Subsurface Infrastructure Networks
            </div>
          </div>
        </div>

        {/* Live Coordinate & Telemetry Bar */}
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <div
            style={{
              padding: "6px 10px",
              backgroundColor: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              border: "1px solid var(--border)"
            }}
          >
            LAT: <span style={{ fontWeight: 600 }}>{cameraStats.lat}°</span> | LON: <span style={{ fontWeight: 600 }}>{cameraStats.lon}°</span> | PITCH: <span style={{ fontWeight: 600 }}>{cameraStats.pitch}°</span>
          </div>

          <button
            onClick={togglePitchMode}
            className="btn-matte"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}
          >
            <RotateCw size={13} />
            <span>{pitchMode === "3d" ? "Switch to 2D Top-Down" : "Switch to 3D Orbit"}</span>
          </button>

          <button
            onClick={resetToNerulCenter}
            className="btn-matte"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}
          >
            <Maximize2 size={13} />
            <span>Center Nerul</span>
          </button>
        </div>
      </div>

      {/* Main Map View Area with 3D Canvas + Overlay Controls + Right Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: "16px", height: "620px" }}>
        {/* Left: MapLibre 3D Satellite Container */}
        <div
          className="card-matte"
          style={{
            position: "relative",
            overflow: "hidden",
            padding: 0,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Map Canvas */}
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

          {/* Quick Jump Bar across Nerul Sectors */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              right: "12px",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "4px",
              zIndex: 10
            }}
          >
            {NERUL_3D_LANDMARKS.slice(0, 7).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedPOI(item);
                  jumpToLocation(item.lon, item.lat, 62, -15, 16.8);
                }}
                style={{
                  backgroundColor: selectedPOI?.id === item.id ? "var(--accent)" : "var(--surface)",
                  color: selectedPOI?.id === item.id ? "var(--surface)" : "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 9px",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                {item.category === "hospital" && <Activity size={12} />}
                {item.category === "school" && <School size={12} />}
                {item.category === "hotel" && <Hotel size={12} />}
                {item.category === "commercial" && <Building2 size={12} />}
                {item.category === "park" && <MapPin size={12} />}
                {item.category === "infrastructure" && <Droplets size={12} />}
                <span>{item.name.split(" ")[0]} {item.name.split(" ")[1] || ""}</span>
              </button>
            ))}

            <button
              onClick={() => jumpToLocation(73.0035, 19.0310, 58, -45, 15.0)}
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Car size={12} />
              <span>Palm Beach Rd</span>
            </button>
          </div>

          {/* Bottom Left: Layer HUD Controls */}
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              fontSize: "11px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              zIndex: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <Layers size={14} />
              <span>Active Overlays:</span>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={activeLayers.buildings3D}
                onChange={e => {
                  const val = e.target.checked;
                  setActiveLayers(prev => ({ ...prev, buildings3D: val }));
                  if (mapRef.current && mapRef.current.getLayer("buildings-3d")) {
                    mapRef.current.setLayoutProperty("buildings-3d", "visibility", val ? "visible" : "none");
                  }
                }}
              />
              <span>3D Structures</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={activeLayers.roadsCorridors}
                onChange={e => {
                  const val = e.target.checked;
                  setActiveLayers(prev => ({ ...prev, roadsCorridors: val }));
                  if (mapRef.current && mapRef.current.getLayer("corridor-lines")) {
                    mapRef.current.setLayoutProperty("corridor-lines", "visibility", val ? "visible" : "none");
                  }
                }}
              />
              <span>Arterials</span>
            </label>

            <span style={{ color: "var(--border)" }}>|</span>

            <span style={{ color: "var(--text-muted)" }}>40 Nerul Sectors Loaded</span>
          </div>
        </div>

        {/* Right: Selected POI / Asset Inspector Drawer */}
        <div
          className="card-matte"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            overflowY: "auto"
          }}
        >
          {selectedPOI ? (
            <>
              {/* Header Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span
                    className={"badge-risk badge-risk-" + selectedPOI.riskBand}
                    style={{ textTransform: "uppercase", fontSize: "10px" }}
                  >
                    {selectedPOI.category} · {selectedPOI.sector}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "6px" }}>
                    {selectedPOI.name}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {selectedPOI.description}
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  backgroundColor: "var(--surface-2)",
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)"
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Asset Health (AHI)</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {selectedPOI.ahi} / 100
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Structure Height</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {selectedPOI.height} m (3D)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>GIS Latitude</div>
                  <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {selectedPOI.lat}° N
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>GIS Longitude</div>
                  <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {selectedPOI.lon}° E
                  </div>
                </div>
              </div>

              {/* Subsurface Connections / Linked Assets */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                  ADJACENT INFRASTRUCTURE NETWORKS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div
                    style={{
                      padding: "8px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      fontSize: "11px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>Water Trunk Feeder (600mm)</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>Active (92 psi)</span>
                  </div>
                  <div
                    style={{
                      padding: "8px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      fontSize: "11px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>Storm Drainage Culvert</span>
                    <span style={{ fontWeight: 600 }}>Clear (0.2m stage)</span>
                  </div>
                  <div
                    style={{
                      padding: "8px",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      fontSize: "11px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>Smart Streetlight Mesh</span>
                    <span style={{ fontWeight: 600, color: "var(--risk-low)" }}>100% Online</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => jumpToLocation(selectedPOI.lon, selectedPOI.lat, 65, 20, 17.5)}
                  className="btn-matte-accent"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <Crosshair size={14} />
                  <span>3D Close-Up Zoom</span>
                </button>

                <button
                  onClick={() => alert("Initiating deep infrastructure scan for " + selectedPOI.name + "...")}
                  className="btn-matte"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <Activity size={14} />
                  <span>Run Predictive Health Scan</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              Click any 3D building or corridor on the map to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
