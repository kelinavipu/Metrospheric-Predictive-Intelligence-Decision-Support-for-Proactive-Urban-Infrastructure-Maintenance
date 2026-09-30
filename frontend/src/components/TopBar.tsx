import React from "react";
import { useStore, store } from "../store/useStore";
import { Search, Bell, Sun, Moon, Shield, User, Compass, FileSpreadsheet } from "lucide-react";
import { api } from "../lib/api";

export const TopBar: React.FC = () => {
  const theme = useStore((s) => s.theme);
  const role = useStore((s) => s.role);
  const liveAlertCount = useStore((s) => s.liveAlertCount);

  return (
    <header
      style={{
        height: "56px",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}
    >
      {/* Left: Branding & Node Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              backgroundColor: "var(--accent)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--surface)",
              fontWeight: 700,
              fontSize: "14px"
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              Metrospheric
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Nerul Node · 19.0330° N, 73.0160° E
            </div>
          </div>
        </div>
      </div>

      {/* Center: Prominent Role Switcher [ Citizen Reporter ] vs [ City Admin ] */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "3px"
        }}
      >
        <button
          onClick={() => {
            store.setRole("citizen");
            store.setActiveTab("citizen");
          }}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            fontWeight: role === "citizen" ? 600 : 400,
            backgroundColor: role === "citizen" ? "var(--surface)" : "transparent",
            color: role === "citizen" ? "var(--accent)" : "var(--text-muted)",
            border: role === "citizen" ? "1px solid var(--border)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <User size={13} />
          <span>Citizen Reporter</span>
        </button>

        <button
          onClick={() => {
            store.setRole("admin");
            store.setActiveTab("command-center");
          }}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            fontWeight: role === "admin" ? 600 : 400,
            backgroundColor: role === "admin" ? "var(--surface)" : "transparent",
            color: role === "admin" ? "var(--accent)" : "var(--text-muted)",
            border: role === "admin" ? "1px solid var(--border)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Shield size={13} />
          <span>City Admin</span>
        </button>
      </div>

      {/* Right: Active Role Tag & Theme Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {role === "admin" && (
          <a
            href={api.downloadCSVDatabaseUrl()}
            download="metrospheric_database.csv"
            title="Download live maintained Excel / CSV database"
            style={{
              fontSize: "11px",
              padding: "4px 9px",
              backgroundColor: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text)",
              textDecoration: "none",
              cursor: "pointer"
            }}
          >
            <FileSpreadsheet size={13} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 600 }}>Excel DB</span>
          </a>
        )}

        <div
          style={{
            fontSize: "11px",
            padding: "4px 8px",
            backgroundColor: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: role === "admin" ? "var(--risk-critical)" : "var(--accent)"
            }}
          />
          <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "10px" }}>
            {role === "admin" ? "Admin Mode" : "User Mode"}
          </span>
        </div>

        <button
          onClick={store.toggleTheme}
          title="Toggle light/dark theme"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text)"
          }}
        >
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
        </button>
      </div>
    </header>
  );
};
