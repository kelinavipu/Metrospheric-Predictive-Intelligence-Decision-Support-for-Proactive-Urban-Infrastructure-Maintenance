import React, { useState, useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "../../lib/api";
import {
  MapPin,
  Send,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Navigation,
  Droplets,
  Car,
  Zap,
  Building2,
  ShieldAlert,
  HelpCircle,
  Link2,
  LocateFixed
} from "lucide-react";

interface QuickLocation {
  label: string;
  address: string;
  lat: number;
  lon: number;
}

const NERUL_QUICK_LOCATIONS: QuickLocation[] = [
  { label: "D.Y. Patil Hospital", address: "Sector 5, opp Dr. D.Y. Patil Hospital, Nerul East", lat: 19.0435, lon: 73.0245 },
  { label: "D.Y. Patil Stadium", address: "Sector 7, Vidyanagari Stadium Marg, Nerul East", lat: 19.0445, lon: 73.0270 },
  { label: "Apollo Hospitals", address: "Sector 23, Parsik Hill Road, Nerul East", lat: 19.0410, lon: 73.0295 },
  { label: "Terna Hospital", address: "Sector 22, near Nerul West Station Road", lat: 19.0380, lon: 73.0190 },
  { label: "Wonders Park", address: "Sector 19A, Wonders Park Marg, Nerul West", lat: 19.0290, lon: 73.0070 },
  { label: "Jewel of Navi Mumbai", address: "Sector 28, Palm Beach Road Promenade", lat: 19.0380, lon: 73.0040 },
  { label: "Seawoods Grand Central", address: "Sector 48, Seawoods Railway Station Complex", lat: 19.0210, lon: 73.0180 }
];

export const CitizenPostView: React.FC = () => {
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({ lat: 19.0330, lon: 73.0160 });
  const [nlpAnalysis, setNlpAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Load recent community complaints
  useEffect(() => {
    loadRecentComplaints();
  }, []);

  const loadRecentComplaints = async () => {
    try {
      const data = await api.getComplaints(15);
      setRecentReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time debounced NLP analysis as user describes the issue
  useEffect(() => {
    if (!description.trim() || description.length < 8) {
      setNlpAnalysis(null);
      return;
    }
    const timer = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const res = await api.suggestNLP(description, coordinates.lat, coordinates.lon);
        setNlpAnalysis(res);
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [description, coordinates]);

  // Initialize interactive map for pin-point location
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
            attribution: "ESRI Satellite"
          }
        },
        layers: [
          {
            id: "satellite-layer",
            type: "raster",
            source: "esri-satellite",
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: [coordinates.lon, coordinates.lat],
      zoom: 14.5,
      pitch: 45
    });

    // Create custom pin element following Matte Clay aesthetics
    const el = document.createElement("div");
    el.style.width = "22px";
    el.style.height = "22px";
    el.style.backgroundColor = "var(--risk-critical)";
    el.style.border = "2px solid var(--surface)";
    el.style.borderRadius = "50%";
    el.style.cursor = "pointer";

    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([coordinates.lon, coordinates.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      setCoordinates({
        lat: Number(lngLat.lat.toFixed(5)),
        lon: Number(lngLat.lng.toFixed(5))
      });
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      setCoordinates({
        lat: Number(e.lngLat.lat.toFixed(5)),
        lon: Number(e.lngLat.lng.toFixed(5))
      });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
    };
  }, []);

  const selectQuickLocation = (loc: QuickLocation) => {
    setAddress(loc.address);
    setCoordinates({ lat: loc.lat, lon: loc.lon });
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([loc.lon, loc.lat]);
      mapRef.current.flyTo({ center: [loc.lon, loc.lat], zoom: 16, pitch: 50, duration: 1200 });
    }
  };

  const applySuggestedLocation = (cand: any) => {
    const fullAddr = cand.address || `${cand.name}, ${cand.sector}, Nerul`;
    setAddress(fullAddr);
    setCoordinates({ lat: cand.lat, lon: cand.lon });
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([cand.lon, cand.lat]);
      mapRef.current.flyTo({ center: [cand.lon, cand.lat], zoom: 16.8, pitch: 55, duration: 1200 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please describe the issue first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitComplaint({
        raw_text: description,
        address: address || "Nerul Node, Navi Mumbai",
        lat: coordinates.lat,
        lon: coordinates.lon,
        reporter_id: "Citizen"
      });
      setSuccessMsg("Issue ticket #" + res.complaint_id + " submitted successfully. City engineering dispatched.");
      setDescription("");
      setNlpAnalysis(null);
      loadRecentComplaints();
      setTimeout(() => setSuccessMsg(null), 7000);
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTagColor = (color: string) => {
    switch (color) {
      case "blue":
        return { bg: "#4A7C9D", label: "Water Issue", text: "var(--surface)" };
      case "grey":
        return { bg: "#7A8288", label: "Road Issue", text: "var(--surface)" };
      case "amber":
        return { bg: "#C9A45C", label: "Electrical / Signal", text: "var(--text)" };
      case "brown":
        return { bg: "#8C6D58", label: "Drainage / Sanitation", text: "var(--surface)" };
      case "red":
      default:
        return { bg: "#A0484A", label: "Critical Hazard", text: "var(--surface)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div className="card-matte" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Citizen Issue Reporting Portal</span>
              <span className="badge-risk badge-risk-low" style={{ fontSize: "10px" }}>NLP-AUGMENTED</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Report impacted infrastructure across Nerul. Metrospheric AI parses your text in real time, classifies the failure category, and alerts municipal operations.
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Active Region:</span>
            <span className="card-matte-inset" style={{ padding: "4px 8px", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              Nerul, Navi Mumbai (19.0330° N, 73.0160° E)
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div
          className="card-matte"
          style={{
            borderLeft: "4px solid var(--accent)",
            backgroundColor: "var(--accent-soft)",
            padding: "12px 16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        {/* Left Column: Issue Submission Form & Pin Locator */}
        <form onSubmit={handleSubmit} className="card-matte" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            1. Describe the Municipal Impact
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Issue Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Major water pipe burst opposite Dr. D.Y. Patil Hospital on Palm Beach Road, street is flooded and road collapsed..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text)",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          {/* Real-time NLP Processing Preview Card */}
          <div
            className="card-matte-inset"
            style={{
              padding: "12px",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
                <span>REAL-TIME NLP DIAGNOSTICS</span>
              </div>
              {analyzing && <span style={{ fontSize: "10px", color: "var(--accent)" }}>Analyzing text...</span>}
            </div>

            {nlpAnalysis ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* 1. Category Tag, Severity, Urgency */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor:
                        nlpAnalysis.severity >= 4
                          ? "#A0484A"
                          : nlpAnalysis.category.includes("water") || nlpAnalysis.category.includes("pipe")
                          ? "#4A7C9D"
                          : nlpAnalysis.category.includes("road") || nlpAnalysis.category.includes("pothole")
                          ? "#7A8288"
                          : nlpAnalysis.category.includes("light") || nlpAnalysis.category.includes("signal") || nlpAnalysis.category.includes("electric") || nlpAnalysis.category.includes("wire")
                          ? "#C9A45C"
                          : "#8C6D58",
                      color: "var(--surface)"
                    }}
                  >
                    Tag: {nlpAnalysis.category.replace("_", " ").toUpperCase()}
                  </span>

                  <span className={"badge-risk badge-risk-" + (nlpAnalysis.severity >= 3 ? "critical" : "moderate")} style={{ fontSize: "10px" }}>
                    Severity Level {nlpAnalysis.severity} ({nlpAnalysis.urgency})
                  </span>

                  {nlpAnalysis.inference_time_ms && (
                    <span className="card-matte" style={{ padding: "3px 6px", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      ⚡ {nlpAnalysis.inference_time_ms} ms
                    </span>
                  )}
                </div>

                {/* 2. Safety Critical Emergency Alert (if safety_flag is True) */}
                {nlpAnalysis.safety_flag && (
                  <div
                    style={{
                      backgroundColor: "rgba(160, 72, 74, 0.12)",
                      border: "1px solid #A0484A",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "11px",
                      color: "#A0484A"
                    }}
                  >
                    <ShieldAlert size={14} />
                    <span style={{ fontWeight: 600 }}>
                      SAFETY ALERT: High-priority hazard cues detected ({nlpAnalysis.safety_cues?.join(", ") || "Urgent safety risk"}). Municipal emergency queue prioritized.
                    </span>
                  </div>
                )}

                {/* 3. Multi-label Impacts & Time Expression */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  {nlpAnalysis.impacts && nlpAnalysis.impacts.map((imp: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        padding: "2px 7px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        color: "var(--text)"
                      }}
                    >
                      Impact: {imp.replace("_", " ")}
                    </span>
                  ))}

                  {nlpAnalysis.time?.has_time && (
                    <span
                      style={{
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        padding: "2px 7px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Clock size={11} style={{ color: "var(--accent)" }} />
                      <span>{nlpAnalysis.time.raw_expression}</span>
                    </span>
                  )}
                </div>

                {/* 4. Anaphora & Coreference Resolution */}
                {nlpAnalysis.anaphora?.has_anaphora && (
                  <div
                    className="card-matte"
                    style={{
                      padding: "8px 10px",
                      fontSize: "11px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      backgroundColor: "var(--surface-2)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--accent)" }}>
                      <Link2 size={12} />
                      <span>AI Anaphora Resolution (Context Grounding)</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {nlpAnalysis.anaphora.chains.map((chain: any, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)"
                          }}
                        >
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>"{chain.pronoun}"</span>
                          {" → "}
                          <span style={{ fontWeight: 600 }}>{chain.antecedent}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Ambiguity Notice (if detected) */}
                {nlpAnalysis.location_grounding?.is_ambiguous && (
                  <div
                    style={{
                      backgroundColor: "rgba(201, 164, 92, 0.12)",
                      border: "1px solid #C9A45C",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "11px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text)" }}>
                      <HelpCircle size={13} style={{ color: "#C9A45C" }} />
                      <span>Ambiguous Location Mention</span>
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>
                      {nlpAnalysis.location_grounding.clarifying_question || "Multiple matching places detected in Nerul. Please select intended spot:"}
                    </div>
                  </div>
                )}

                {/* 6. AI Suggestive Location Cards */}
                {nlpAnalysis.location_grounding?.suggestions && nlpAnalysis.location_grounding.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Suggested Places (Confirm to Pin):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {nlpAnalysis.location_grounding.suggestions.slice(0, 3).map((cand: any, idx: number) => {
                        const isCurrent = Math.abs(coordinates.lat - cand.lat) < 0.001 && Math.abs(coordinates.lon - cand.lon) < 0.001;
                        return (
                          <div
                            key={idx}
                            onClick={() => applySuggestedLocation(cand)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              backgroundColor: isCurrent ? "var(--accent-soft)" : "var(--surface)",
                              border: isCurrent ? "2px solid var(--accent)" : "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "11px",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: 700 }}>{cand.name}</span>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    padding: "1px 5px",
                                    backgroundColor: "var(--surface-2)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-sm)",
                                    color: "var(--accent)"
                                  }}
                                >
                                  {Math.round(cand.confidence * 100)}% Match
                                </span>
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                📍 {cand.address} · <span style={{ fontStyle: "italic" }}>{cand.explanation}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                applySuggestedLocation(cand);
                              }}
                              className={isCurrent ? "btn-matte-accent" : "btn-matte"}
                              style={{
                                padding: "5px 10px",
                                fontSize: "10px",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              <LocateFixed size={12} />
                              <span>{isCurrent ? "Pinned ✓" : "Pin This Spot"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Type an issue description above. Metrospheric AI will resolve pronouns, detect ambiguities, and suggest matching Nerul landmarks with exact pin coordinates.
              </div>
            )}
          </div>

          <div style={{ fontSize: "14px", fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginTop: "4px" }}>
            2. Location & Address in Nerul
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Address / Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Palm Beach Road near Dr. D.Y. Patil Hospital, Nerul"
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text)",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          {/* Quick Select Chips */}
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Quick-select prominent Nerul locations:
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {NERUL_QUICK_LOCATIONS.map((loc) => (
                <button
                  type="button"
                  key={loc.label}
                  onClick={() => selectQuickLocation(loc)}
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "var(--text)"
                  }}
                >
                  📍 {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pin Location on Map preview */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                3. Locate Impact on Map (Click or Drag Pin)
              </label>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                {coordinates.lat}° N, {coordinates.lon}° E
              </span>
            </div>
            <div
              style={{
                height: "220px",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                position: "relative"
              }}
            >
              <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "8px",
                  backgroundColor: "var(--surface)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "10px",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)"
                }}
              >
                Click map to drop pin at exact incident spot
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-matte-accent"
            style={{
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "13px",
              marginTop: "4px"
            }}
          >
            <Send size={14} />
            <span>{submitting ? "Submitting to Metrospheric..." : "Submit Incident Report"}</span>
          </button>
        </form>

        {/* Right Column: Live Community Reports Feed */}
        <div className="card-matte" style={{ display: "flex", flexDirection: "column", gap: "12px", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Recent Nerul Incident Reports</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Track real-time resolution status</div>
            </div>
            <span className="badge-risk badge-risk-low" style={{ fontSize: "10px" }}>LIVE</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "620px", overflowY: "auto" }}>
            {recentReports.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "20px" }}>
                No reports found. Be the first to report an issue!
              </div>
            ) : (
              recentReports.map((report) => {
                const tagInfo = getTagColor(report.color_tag || "grey");
                return (
                  <div
                    key={report.complaint_id}
                    className="card-matte-inset"
                    style={{
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      borderLeft: "4px solid " + tagInfo.bg
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          backgroundColor: tagInfo.bg,
                          color: "var(--surface)",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)"
                        }}
                      >
                        {tagInfo.label}
                      </span>
                      <span
                        className={
                          "badge-risk badge-risk-" +
                          (report.status === "resolved" ? "low" : report.status === "dispatched" ? "moderate" : "critical")
                        }
                        style={{ fontSize: "10px", textTransform: "uppercase" }}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", fontWeight: 500, lineHeight: 1.4 }}>
                      {report.raw_text}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>📍 {report.address || "Nerul Sector Corridor"}</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{report.received_at ? report.received_at.slice(0, 10) : "Today"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
