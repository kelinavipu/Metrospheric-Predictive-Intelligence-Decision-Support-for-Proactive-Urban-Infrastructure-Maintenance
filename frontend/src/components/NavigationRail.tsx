import React from "react";
import { useStore, store, PageTab } from "../store/useStore";
import {
  Send,
  Compass,
  Layers,
  BrainCircuit,
  MessageSquareWarning,
  Wrench,
  Palette,
  Shield,
  User,
  SlidersHorizontal,
  Building2
} from "lucide-react";

export const NavigationRail: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const role = useStore((s) => s.role);

  return (
    <aside
      style={{
        width: "220px",
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: "var(--accent)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--surface)",
            fontWeight: 700,
            fontSize: "15px"
          }}
        >
          M
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.3px" }}>Metrospheric</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {role === "admin" ? "Admin Operations" : "Citizen Reporter"}
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: "12px 8px", flex: 1, overflowY: "auto" }}>
        {role === "citizen" ? (
          <>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "6px 12px" }}>
              Citizen Actions
            </div>
            <button
              onClick={() => store.setActiveTab("citizen")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "citizen" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "citizen" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "citizen" ? 600 : 400,
                border: activeTab === "citizen" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <Send size={15} />
              <span>Report Issue & Pin</span>
            </button>

            <button
              onClick={() => store.setActiveTab("command-center")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "command-center" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "command-center" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "command-center" ? 600 : 400,
                border: activeTab === "command-center" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <Compass size={15} />
              <span>Nerul 3D Explorer</span>
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "6px 12px" }}>
              Admin Operations
            </div>

            <button
              onClick={() => store.setActiveTab("command-center")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "command-center" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "command-center" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "command-center" ? 600 : 400,
                border: activeTab === "command-center" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <Compass size={15} />
              <span>3D Pin Map (Admin)</span>
            </button>

            <button
              onClick={() => store.setActiveTab("assets")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "assets" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "assets" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "assets" ? 600 : 400,
                border: activeTab === "assets" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <Layers size={15} />
              <span>Asset Inventory</span>
            </button>

            <button
              onClick={() => store.setActiveTab("complaints")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "complaints" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "complaints" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "complaints" ? 600 : 400,
                border: activeTab === "complaints" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <MessageSquareWarning size={15} />
              <span>NLP Studio</span>
            </button>

            <button
              onClick={() => store.setActiveTab("predictive")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "predictive" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "predictive" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "predictive" ? 600 : 400,
                border: activeTab === "predictive" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <BrainCircuit size={15} />
              <span>Predictive ML</span>
            </button>

            <button
              onClick={() => store.setActiveTab("field")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "4px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === "field" ? "var(--accent-soft)" : "transparent",
                color: activeTab === "field" ? "var(--text)" : "var(--text-muted)",
                fontWeight: activeTab === "field" ? 600 : 400,
                border: activeTab === "field" ? "1px solid var(--border)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <Wrench size={15} />
              <span>Field Crew Dispatch</span>
            </button>
          </>
        )}

        <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
          <button
            onClick={() => store.setActiveTab("tokens")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: activeTab === "tokens" ? "var(--accent-soft)" : "transparent",
              color: activeTab === "tokens" ? "var(--text)" : "var(--text-muted)",
              fontWeight: activeTab === "tokens" ? 600 : 400,
              border: "1px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px"
            }}
          >
            <Palette size={14} />
            <span>Matte Tokens</span>
          </button>
        </div>
      </nav>

      {/* Quick Role Switch at Bottom */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)", backgroundColor: "var(--surface-2)" }}>
        <button
          onClick={() => {
            const next = role === "citizen" ? "admin" : "citizen";
            store.setRole(next);
            store.setActiveTab(next === "citizen" ? "citizen" : "command-center");
          }}
          className="btn-matte"
          style={{ width: "100%", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {role === "citizen" ? <Shield size={12} /> : <User size={12} />}
          <span>Switch to {role === "citizen" ? "Admin Mode" : "Citizen Mode"}</span>
        </button>
      </div>
    </aside>
  );
};
