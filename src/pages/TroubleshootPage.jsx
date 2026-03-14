import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";

// ── Inline tokens (no designTokens.js yet) ──────────────────────
const C = {
  primary:    "#1a56db",
  primaryBg:  "#eff6ff",
  dark:       "#111827",
  medium:     "#374151",
  light:      "#6b7280",
  lighter:    "#9ca3af",
  border:     "#e5e7eb",
  borderDark: "#d1d5db",
  bg:         "#f9fafb",
  white:      "#ffffff",
  accent:     "#f59e0b",   // amber — machine/warning feel
  accentBg:   "#fffbeb",
  green:      "#10b981",
  greenBg:    "#ecfdf5",
  red:        "#ef4444",
  redBg:      "#fef2f2",
};

// ── Helpers ─────────────────────────────────────────────────────
function highlight(text = "", query = "") {
  if (!query.trim() || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: "#fde68a", color: C.dark, borderRadius: "2px", padding: "0 1px" }}>{p}</mark>
      : p
  );
}

function resultBadge(result = "") {
  const r = result?.toLowerCase() || "";
  if (r.includes("resolv") || r.includes("fixed") || r.includes("success"))
    return { label: "Resolved", bg: C.greenBg, color: C.green, dot: C.green };
  if (r.includes("ongoing") || r.includes("pending") || r.includes("monitor"))
    return { label: "Ongoing", bg: C.accentBg, color: "#b45309", dot: C.accent };
  return { label: "Logged", bg: "#f3f4f6", color: C.light, dot: C.lighter };
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ── Sub-components ───────────────────────────────────────────────

function Badge({ result }) {
  const b = resultBadge(result);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "999px",
      background: b.bg, color: b.color,
      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.dot, display: "inline-block" }} />
      {b.label}
    </span>
  );
}

function LogCard({ log, query, isMobile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${C.primary}`,
        borderRadius: "10px",
        overflow: "hidden",
        transition: "box-shadow 180ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"}
      onClick={() => setExpanded(x => !x)}
    >
      {/* Card Header */}
      <div style={{
        padding: isMobile ? "14px 16px" : "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Machine code pill */}
          <div style={{ marginBottom: "6px" }}>
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: C.primary,
              background: C.primaryBg,
              padding: "2px 8px",
              borderRadius: "4px",
            }}>
              {log.machines?.machine_code || "UNKNOWN"}
            </span>
          </div>

          {/* Issue title */}
          <h3 style={{
            margin: "0 0 6px 0",
            fontSize: isMobile ? "0.95rem" : "1.02rem",
            fontWeight: 700,
            color: C.dark,
            lineHeight: 1.35,
          }}>
            {highlight(log.issue_title, query)}
          </h3>

          {/* Symptom preview */}
          {!expanded && (
            <p style={{
              margin: 0,
              fontSize: "0.82rem",
              color: C.light,
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {highlight(log.symptom, query)}
            </p>
          )}
        </div>

        {/* Right side: badge + date + chevron */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
          <Badge result={log.result} />
          <span style={{ fontSize: "0.72rem", color: C.lighter, whiteSpace: "nowrap" }}>
            {formatDate(log.created_at)}
          </span>
          <span style={{
            fontSize: "0.8rem", color: C.lighter,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}>▼</span>
        </div>
      </div>

      {/* Expanded detail rows */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: isMobile ? "14px 16px" : "16px 20px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "14px",
        }}>
          <Field label="Symptom" value={log.symptom} query={query} />
          <Field label="Action Taken" value={log.action_taken} query={query} />
          <Field label="Result" value={log.result} query={query} />
          <Field label="Logged By" value={log.created_by || "—"} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, query }) {
  return (
    <div>
      <div style={{
        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: C.lighter, marginBottom: "4px",
      }}>
        {label}
      </div>
      <div style={{ fontSize: "0.875rem", color: C.medium, lineHeight: 1.55 }}>
        {query ? highlight(value || "—", query) : (value || "—")}
      </div>
    </div>
  );
}

function EmptyState({ query }) {
  if (query.trim().length > 2) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: C.dark, margin: "0 0 6px" }}>No results found</p>
        <p style={{ fontSize: "0.875rem", color: C.light, margin: 0 }}>
          Try searching by symptom, issue title, or action taken.
        </p>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔧</div>
      <p style={{ fontSize: "1rem", fontWeight: 600, color: C.dark, margin: "0 0 6px" }}>
        Search maintenance history
      </p>
      <p style={{ fontSize: "0.875rem", color: C.light, margin: "0 0 20px" }}>
        Find past issues by title, symptom, or action taken.
      </p>
      <div style={{
        display: "inline-flex", flexDirection: "column", gap: "8px",
        textAlign: "left", background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: "8px", padding: "14px 18px",
      }}>
        {[
          ["🔩", "Machine code", "M-0042"],
          ["⚠️", "Symptom keyword", "vibration, overheating"],
          ["🛠", "Action taken", "replaced bearing"],
        ].map(([icon, label, eg]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1rem" }}>{icon}</span>
            <span style={{ fontSize: "0.8rem", color: C.medium }}>
              <strong>{label}</strong>
              <span style={{ color: C.lighter }}> — e.g. </span>
              <span style={{ fontFamily: "monospace", color: C.primary }}>{eg}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
function TroubleshootPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const device = useDeviceType();
  const isMobile = device === "mobile";
  const isDesktop = device === "desktop";
  const inputRef = useRef(null);

  // Load recent logs on mount
  useEffect(() => {
    async function loadRecent() {
      const { data } = await supabase
        .from("maintenance_logs")
        .select("*, machines(machine_code)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentLogs(data);
    }
    loadRecent();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length <= 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*, machines(machine_code)")
        .or(`issue_title.ilike.%${query}%,symptom.ilike.%${query}%,action_taken.ilike.%${query}%`)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (!error) setResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const showingSearch = query.trim().length > 2;
  const displayLogs = showingSearch ? results : recentLogs;
  const sectionLabel = showingSearch
    ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`
    : "Recent maintenance logs";

  return (
    <AppLayout>
      {/* ── Page styles injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=DM+Sans:wght@400;500;600;700&display=swap');
        .ts-search-wrap { position: relative; }
        .ts-search-input {
          width: 100%;
          box-sizing: border-box;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          color: #111827;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px 46px 13px 46px;
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }
        .ts-search-input:focus {
          border-color: #1a56db;
          box-shadow: 0 0 0 3px rgba(26,86,219,0.12);
        }
        .ts-search-input::placeholder { color: #9ca3af; }
        .ts-clear-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: #e5e7eb; border: none; border-radius: 50%;
          width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.7rem; color: #6b7280;
          transition: background 150ms;
        }
        .ts-clear-btn:hover { background: #d1d5db; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: isMobile ? "20px" : "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: isMobile ? "1.4rem" : "1.6rem" }}>🔧</span>
          <h2 style={{
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: isMobile ? "1.3rem" : "1.6rem",
            fontWeight: 700,
            color: C.dark,
            letterSpacing: "-0.02em",
          }}>
            Troubleshoot
          </h2>
        </div>
        <p style={{
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.875rem",
          color: C.light,
        }}>
          Search past maintenance records by issue, symptom, or action taken.
        </p>
      </div>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: isMobile ? "24px" : "32px" }}>
        <div className="ts-search-wrap">
          {/* Search icon */}
          <span style={{
            position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)",
            fontSize: "1rem", color: C.lighter, pointerEvents: "none",
          }}>🔍</span>

          <input
            ref={inputRef}
            className="ts-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search issues, symptoms, actions…"
            autoComplete="off"
          />

          {query && (
            <button className="ts-clear-btn" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
              ✕
            </button>
          )}
        </div>

        {/* Loading bar */}
        {loading && (
          <div style={{
            marginTop: "6px", height: "2px", background: C.border, borderRadius: "2px", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: "40%", background: C.primary, borderRadius: "2px",
              animation: "ts-slide 0.9s ease-in-out infinite alternate",
            }} />
            <style>{`
              @keyframes ts-slide {
                from { transform: translateX(-100%); }
                to   { transform: translateX(300%); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* ── Results / empty state ── */}
      {!loading && (displayLogs.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <>
          {/* Section label */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: C.lighter,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}>
              {sectionLabel}
            </span>
            {showingSearch && (
              <button
                onClick={() => setQuery("")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.78rem", color: C.primary, fontFamily: "'DM Sans', sans-serif",
                  padding: 0,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Cards list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayLogs.map(log => (
              <LogCard key={log.id} log={log} query={showingSearch ? query : ""} isMobile={isMobile} />
            ))}
          </div>
        </>
      ))}
    </AppLayout>
  );
}

export default TroubleshootPage;