import React, { useState, useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "../../lib/api";
import {
  Layers,
  Compass,
  Crosshair,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  Sparkles,
  MapPin,
  Maximize2,
  RotateCw,
  Droplets,
  Car,
  Zap,
  Building2,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Table,
  Download,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ComplaintItem {
  complaint_id: string;
  received_at: string;
  raw_text: string;
  address?: string;
  lat: number;
  lon: number;
  category: string;
  subcategory?: string;
  severity: number;
  urgency: string;
  color_tag: "blue" | "grey" | "amber" | "brown" | "red";
  extracted_entities?: any[];
  linked_asset_id?: string;
  link_confidence?: number;
  status: "open" | "triaged" | "dispatched" | "resolved";
}

const NERUL_3D_STRUCTURES = [
  {
    name: "Dr. D.Y. Patil Hospital",
    height: 48,
    footprint: [
      [73.0238, 19.0428], [73.0252, 19.0428], [73.0252, 19.0442], [73.0238, 19.0442], [73.0238, 19.0428]
    ]
  },
  {
    name: "Dr. D.Y. Patil Stadium",
    height: 38,
    footprint: [
      [73.0258, 19.0435], [73.0282, 19.0435], [73.0282, 19.0455], [73.0258, 19.0455], [73.0258, 19.0435]
    ]
  },
  {
    name: "Apollo Hospitals Nerul",
    height: 42,
    footprint: [
      [73.0288, 19.0403], [73.0302, 19.0403], [73.0302, 19.0417], [73.0288, 19.0417], [73.0288, 19.0403]
    ]
  },
  {
    name: "Seawoods Grand Central",
    height: 65,
    footprint: [
      [73.0168, 19.0198], [73.0192, 19.0198], [73.0192, 19.0222], [73.0168, 19.0222], [73.0168, 19.0198]
    ]
  },
  {
    name: "Wonders Park Pavilion",
    height: 30,
    footprint: [
      [73.0055, 19.0275], [73.0085, 19.0275], [73.0085, 19.0305], [73.0055, 19.0305], [73.0055, 19.0275]
    ]
  }
];

export const AdminMapView: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSpreadsheet, setShowSpreadsheet] = useState(true);
  const [tableSearch, setTableSearch] = useState("");
  const [dbMeta, setDbMeta] = useState<{ total_records?: number; last_updated?: string; file_size_bytes?: number } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaints(100);
      setComplaints(data);
      if (data.length > 0 && !selectedComplaint) {
        setSelectedComplaint(data[0]);
      }
      try {
        const meta = await api.getDatabaseSummary();
        setDbMeta(meta);
      } catch (err) {
        // non-blocking
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initialize 3D Satellite Map with ESRI World Imagery
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
          },
          "nerul-buildings": {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: NERUL_3D_STRUCTURES.map((s, idx) => ({
                type: "Feature",
                properties: {
                  id: "bldg-" + idx,
                  name: s.name,
                  height: s.height
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [s.footprint]
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
            id: "buildings-3d",
            type: "fill-extrusion",
            source: "nerul-buildings",
            paint: {
              "fill-extrusion-color": "#5F7A6F",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.85
            }
          }
        ]
      },
      center: [73.0160, 19.0330],
      zoom: 14.3,
      pitch: 56,
      bearing: -18,
      maxPitch: 75
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update Markers whenever complaints or filters change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = complaints.filter((c) => {
      const matchCat = categoryFilter === "all" || c.color_tag === categoryFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchCat && matchStatus;
    });

    filtered.forEach((c) => {
      const lat = c.lat || 19.0330;
      const lon = c.lon || 73.0160;

      // Color mapping based on NLP tag
      const pinColor =
        c.color_tag === "blue"
          ? "#4A7C9D"
          : c.color_tag === "grey"
          ? "#7A8288"
          : c.color_tag === "amber"
          ? "#C9A45C"
          : c.color_tag === "brown"
          ? "#8C6D58"
          : "#A0484A";

      // Pin DOM element adhering strictly to Matte Clay rules
      const el = document.createElement("div");
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = pinColor;
      el.style.border = "2px solid var(--surface)";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.title = c.raw_text;

      // Inner dot
      const dot = document.createElement("div");
      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = "var(--surface)";
      el.appendChild(dot);

      el.addEventListener("click", () => {
        setSelectedComplaint(c);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lon, lat], zoom: 16.5, pitch: 60, duration: 1200 });
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [complaints, categoryFilter, statusFilter]);

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await api.updateComplaintStatus(complaintId, newStatus);
      setComplaints((prev) =>
        prev.map((c) => (c.complaint_id === complaintId ? { ...c, status: newStatus as any } : c))
      );
      if (selectedComplaint && selectedComplaint.complaint_id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus as any });
      }
      api.getDatabaseSummary().then(setDbMeta).catch(() => {});
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case "blue":
        return { label: "Water Issue", bg: "#4A7C9D" };
      case "grey":
        return { label: "Road Issue", bg: "#7A8288" };
      case "amber":
        return { label: "Electrical / Signal", bg: "#C9A45C" };
      case "brown":
        return { label: "Drainage / Sewer", bg: "#8C6D58" };
      case "red":
      default:
        return { label: "Critical Hazard", bg: "#A0484A" };
    }
  };

  const flyToIncident = (lon: number, lat: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 16.8, pitch: 62, bearing: -15, duration: 1400 });
    }
  };

  const waterCount = complaints.filter((c) => c.color_tag === "blue").length;
  const roadCount = complaints.filter((c) => c.color_tag === "grey").length;
  const electricalCount = complaints.filter((c) => c.color_tag === "amber").length;
  const drainageCount = complaints.filter((c) => c.color_tag === "brown").length;
  const criticalCount = complaints.filter((c) => c.color_tag === "red").length;

  const filteredTableComplaints = complaints.filter((c) => {
    if (categoryFilter !== "all" && c.color_tag !== categoryFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchId = c.complaint_id.toLowerCase().includes(q);
      const matchText = c.raw_text.toLowerCase().includes(q);
      const matchAddr = (c.address || "").toLowerCase().includes(q);
      const matchCat = c.category.toLowerCase().includes(q);
      return matchId || matchText || matchAddr || matchCat;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Banner & KPI Stat Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
        <div className="card-matte">
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total User Issues
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "4px" }}>
            {complaints.length}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Reported across Nerul
          </div>
        </div>

        <div className="card-matte" style={{ borderLeft: "4px solid #4A7C9D" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Water Incidents
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "4px", color: "#4A7C9D" }}>
            {waterCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Tagged Blue by NLP
          </div>
        </div>

        <div className="card-matte" style={{ borderLeft: "4px solid #7A8288" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Road Defects
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "4px", color: "#7A8288" }}>
            {roadCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Tagged Grey by NLP
          </div>
        </div>

        <div className="card-matte" style={{ borderLeft: "4px solid #C9A45C" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Electrical & Signals
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "4px", color: "#C9A45C" }}>
            {electricalCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Tagged Amber by NLP
          </div>
        </div>

        <div className="card-matte" style={{ borderLeft: "4px solid #A0484A" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Critical Hazards
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: "4px", color: "#A0484A" }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Emergency level action
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card-matte"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        {/* Category NLP Filter Pills */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginRight: "4px" }}>
            NLP Tag Filter:
          </span>
          {[
            { id: "all", label: "All Pins (" + complaints.length + ")", bg: "var(--surface-2)" },
            { id: "blue", label: "🔵 Water (" + waterCount + ")", bg: "#4A7C9D" },
            { id: "grey", label: "🩶 Roads (" + roadCount + ")", bg: "#7A8288" },
            { id: "amber", label: "🟡 Electrical (" + electricalCount + ")", bg: "#C9A45C" },
            { id: "brown", label: "🟤 Drainage (" + drainageCount + ")", bg: "#8C6D58" },
            { id: "red", label: "🔴 Critical (" + criticalCount + ")", bg: "#A0484A" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                backgroundColor: categoryFilter === cat.id ? "var(--accent)" : "var(--surface)",
                color: categoryFilter === cat.id ? "var(--surface)" : "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 9px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filter and Export Button */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>STATUS:</span>
            {["all", "open", "triaged", "dispatched", "resolved"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  backgroundColor: statusFilter === st ? "var(--accent-soft)" : "transparent",
                  color: statusFilter === st ? "var(--accent)" : "var(--text-muted)",
                  border: statusFilter === st ? "1px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "3px 8px",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <a
            href={api.downloadCSVDatabaseUrl()}
            download="metrospheric_database.csv"
            className="btn-matte-accent"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              padding: "5px 11px"
            }}
            title="Download complete maintained Excel / CSV database"
          >
            <FileSpreadsheet size={13} />
            <span>Export Excel DB</span>
          </a>
        </div>
      </div>

      {/* Main Grid: 3D Map + Incident Inspector Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "16px", height: "640px" }}>
        {/* Left: 3D Satellite Map Container */}
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
          {/* Map canvas */}
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

          {/* Map overlay legend */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
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
            <div style={{ fontWeight: 600, color: "var(--text)" }}>NLP Pin Legend:</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#4A7C9D" }} />
              <span>Water</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#7A8288" }} />
              <span>Road</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#C9A45C" }} />
              <span>Signal/Lighting</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#8C6D58" }} />
              <span>Drainage</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#A0484A" }} />
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Pin Inspector Drawer */}
        <div
          className="card-matte"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            overflowY: "auto"
          }}
        >
          {selectedComplaint ? (
            <>
              {/* Top Title & Tag */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      backgroundColor: getTagBadge(selectedComplaint.color_tag).bg,
                      color: "var(--surface)",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm)",
                      textTransform: "uppercase"
                    }}
                  >
                    {getTagBadge(selectedComplaint.color_tag).label}
                  </span>
                  <span
                    className={
                      "badge-risk badge-risk-" +
                      (selectedComplaint.status === "resolved"
                        ? "low"
                        : selectedComplaint.status === "dispatched"
                        ? "moderate"
                        : "critical")
                    }
                    style={{ textTransform: "uppercase", fontSize: "10px" }}
                  >
                    Status: {selectedComplaint.status}
                  </span>
                </div>

                <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "8px" }}>
                  Ticket #{selectedComplaint.complaint_id}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  📍 {selectedComplaint.address || "Nerul Sector Corridor"}
                </div>
              </div>

              {/* Citizen Description */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Citizen Description
                </div>
                <div
                  className="card-matte-inset"
                  style={{ padding: "10px", fontSize: "12px", lineHeight: 1.4, fontStyle: "italic" }}
                >
                  \"{selectedComplaint.raw_text}\"
                </div>
              </div>

              {/* NLP Diagnostics Card */}
              <div
                className="card-matte-inset"
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600 }}>
                  <Sparkles size={13} style={{ color: "var(--accent)" }} />
                  <span>NLP Model Classification</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Category: </span>
                    <span style={{ fontWeight: 600 }}>{selectedComplaint.category}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Severity: </span>
                    <span style={{ fontWeight: 600 }}>Level {selectedComplaint.severity}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Urgency: </span>
                    <span style={{ fontWeight: 600 }}>{selectedComplaint.urgency}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Confidence: </span>
                    <span style={{ fontWeight: 600 }}>{Math.round((selectedComplaint.link_confidence || 0.88) * 100)}%</span>
                  </div>
                </div>

                {selectedComplaint.linked_asset_id && (
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Linked Municipal Asset: </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>
                      {selectedComplaint.linked_asset_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Coordinates & Location Jump */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  {selectedComplaint.lat}° N, {selectedComplaint.lon}° E
                </span>
                <button
                  onClick={() => flyToIncident(selectedComplaint.lon, selectedComplaint.lat)}
                  className="btn-matte"
                  style={{ padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Crosshair size={12} />
                  <span>Focus in 3D</span>
                </button>
              </div>

              {/* Admin Actions */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Admin Actions & Work Order Dispatch
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    disabled={updating || selectedComplaint.status === "triaged"}
                    onClick={() => handleUpdateStatus(selectedComplaint.complaint_id, "triaged")}
                    className="btn-matte"
                    style={{ fontSize: "11px", padding: "8px" }}
                  >
                    Mark Triaged
                  </button>

                  <button
                    disabled={updating || selectedComplaint.status === "resolved"}
                    onClick={() => handleUpdateStatus(selectedComplaint.complaint_id, "resolved")}
                    className="btn-matte"
                    style={{ fontSize: "11px", padding: "8px" }}
                  >
                    Mark Resolved
                  </button>
                </div>

                <button
                  disabled={updating || selectedComplaint.status === "dispatched"}
                  onClick={() => handleUpdateStatus(selectedComplaint.complaint_id, "dispatched")}
                  className="btn-matte-accent"
                  style={{
                    fontSize: "12px",
                    padding: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Wrench size={13} />
                  <span>Dispatch Municipal Crew</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "12px" }}>
              Click any colored pin on the map to inspect incident details
            </div>
          )}
        </div>
      </div>

      {/* Live Maintained Excel/CSV Spreadsheet Table */}
      <div className="card-matte" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: "var(--surface-2)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)"
              }}
            >
              <Table size={16} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>
                  Live Maintained Database (Excel / CSV)
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 7px",
                    backgroundColor: "var(--surface-2)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  data/metrospheric_database.csv
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 7px",
                    backgroundColor: "var(--surface-2)",
                    color: "var(--risk-low)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)"
                  }}
                >
                  ● Auto-synced on each report
                </span>
                {dbMeta?.total_records && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    ({dbMeta.total_records.toLocaleString()} total rows in CSV)
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Maintains a single consolidated database table tracking all citizen reports, NLP categorization, coordinates, and workflow statuses.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Live Search Filter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px"
              }}
            >
              <Search size={12} style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search ticket, address, mode..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  fontSize: "11px",
                  color: "var(--text)",
                  width: "180px"
                }}
              />
            </div>

            <a
              href={api.downloadCSVDatabaseUrl()}
              download="metrospheric_database.csv"
              className="btn-matte-accent"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                padding: "6px 12px"
              }}
            >
              <Download size={12} />
              <span>Download Excel / CSV</span>
            </a>

            <button
              onClick={() => setShowSpreadsheet(!showSpreadsheet)}
              className="btn-matte"
              style={{ padding: "6px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
            >
              {showSpreadsheet ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span>{showSpreadsheet ? "Collapse" : "Expand"}</span>
            </button>
          </div>
        </div>

        {showSpreadsheet && (
          <div style={{ overflowX: "auto", maxHeight: "380px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
                textAlign: "left"
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Ticket ID</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Time</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Color Tag</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>NLP Category</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Address / Location</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Coordinates</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Severity</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Urgency</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)" }}>Status</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-muted)", textAlign: "right" }}>Map Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableComplaints.map((item) => {
                  const isSelected = selectedComplaint?.complaint_id === item.complaint_id;
                  const tagInfo = getTagBadge(item.color_tag);
                  return (
                    <tr
                      key={item.complaint_id}
                      onClick={() => {
                        setSelectedComplaint(item);
                        flyToIncident(item.lon, item.lat);
                      }}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        backgroundColor: isSelected ? "var(--surface-2)" : "transparent",
                        cursor: "pointer"
                      }}
                    >
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {item.complaint_id}
                      </td>
                      <td style={{ padding: "8px 10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(item.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span
                          style={{
                            backgroundColor: tagInfo.bg,
                            color: "var(--surface)",
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "var(--radius-sm)",
                            textTransform: "uppercase"
                          }}
                        >
                          {tagInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>
                        {item.category}
                      </td>
                      <td style={{ padding: "8px 10px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.address || "Nerul Node Corridor"}
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "10px" }}>
                        {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontWeight: 700, color: item.severity >= 4 ? "var(--risk-critical)" : "inherit" }}>
                          Lvl {item.severity}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textTransform: "capitalize", color: "var(--text-muted)" }}>
                        {item.urgency}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span
                          className={
                            "badge-risk badge-risk-" +
                            (item.status === "resolved" ? "low" : item.status === "dispatched" ? "moderate" : "critical")
                          }
                          style={{ textTransform: "uppercase", fontSize: "9px", padding: "2px 5px" }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaint(item);
                            flyToIncident(item.lon, item.lat);
                          }}
                          className="btn-matte"
                          style={{ padding: "3px 6px", fontSize: "10px" }}
                        >
                          Focus 3D
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
