import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import { useDeviceType } from "../hooks/useDeviceType";
import { colors, spacing, borderRadius } from "../constants/designTokens";

function MachinePage() {
  const { factoryId, machineId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const device = useDeviceType();
  const isDesktop = device === "desktop";
  const isMobile = device === "mobile";

  const [machine, setMachine] = useState(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [partTransactions, setPartTransactions] = useState([]);
  const [consumableTransactions, setConsumableTransactions] = useState([]);
  const [showAddLogForm, setShowAddLogForm] = useState(false);

  const [issueTitle, setIssueTitle] = useState("");
  const [symptom, setSymptom] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMachine();
    fetchMaintenanceLogs();
    fetchPartTransactions();
    fetchConsumableTransactions();
  }, []);

  async function fetchMachine() {
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .eq("id", machineId)
      .single();
    if (!error) setMachine(data);
  }

  async function fetchMaintenanceLogs() {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("machine_id", machineId)
      .order("created_at", { ascending: false });
    if (!error) setMaintenanceLogs(data || []);
  }

  async function fetchPartTransactions() {
    const { data, error } = await supabase
      .from("stock_transactions")
      .select("*, parts(part_name, part_code)")
      .eq("machine_id", machineId)
      .order("created_at", { ascending: false });
    if (!error) setPartTransactions(data || []);
  }

  async function fetchConsumableTransactions() {
    const { data, error } = await supabase
      .from("consumable_transactions")
      .select("*, consumables(name)")
      .eq("machine_id", machineId)
      .order("created_at", { ascending: false });
    if (!error) setConsumableTransactions(data || []);
  }

  async function handleSaveLog() {
    if (!issueTitle) { alert("Please enter an issue title"); return; }
    setIsSaving(true);
    const { error } = await supabase.from("maintenance_logs").insert([{
      factory_id: Number(factoryId),
      machine_id: Number(machineId),
      issue_title: issueTitle,
      symptom,
      action_taken: actionTaken,
      result,
      created_by: "Kajol",
    }]);
    setIsSaving(false);
    if (error) { alert("Failed to save log"); return; }
    alert("Log saved!");
    setIssueTitle(""); setSymptom(""); setActionTaken(""); setResult("");
    setShowAddLogForm(false);
    fetchMaintenanceLogs();
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  const selectStyle = {
    padding: spacing.md, borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`, fontSize: "0.875rem",
    width: "100%", height: "42px",
    backgroundColor: colors.white, color: colors.darkText,
  };

  const formCard = {
    backgroundColor: colors.white, borderRadius: "12px", padding: spacing.xl,
    border: `1px solid ${colors.border}`, marginBottom: spacing.lg,
  };

  if (!machine) return (
    <AppLayout>
      <p style={{ color: colors.lightText }}>{t('loading_factory')}</p>
    </AppLayout>
  );

  return (
    <AppLayout>

      {/* Back button */}
      <button
        onClick={() => navigate(`/factory/${factoryId}`)}
        style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, fontSize: "0.9rem", fontWeight: "600", marginBottom: spacing.lg, padding: 0, display: "flex", alignItems: "center", gap: "6px" }}
      >
        ← {t('factories')}
      </button>

      {/* Machine Header */}
      <div style={{
        backgroundColor: colors.white, borderRadius: "12px",
        padding: isDesktop ? spacing.xl : spacing.lg,
        marginBottom: spacing.xl,
        border: `1px solid ${colors.border}`,
        display: "flex", alignItems: "center", gap: spacing.lg,
      }}>
        <div style={{
          width: isDesktop ? "56px" : "44px", height: isDesktop ? "56px" : "44px",
          backgroundColor: "#EFF6FF", borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isDesktop ? "1.6rem" : "1.3rem", flexShrink: 0,
        }}>⚙️</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: isDesktop ? "1.5rem" : "1.2rem", fontWeight: "700", color: colors.darkText }}>
            {machine.machine_name}
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: colors.lightText }}>
            {t('code')}: {machine.machine_code}
          </p>
        </div>
        <span style={{
          display: "inline-block", padding: "4px 14px", borderRadius: "999px",
          fontSize: "0.8rem", fontWeight: "600",
          backgroundColor: machine.status === "active" ? "#D1FAE5" : "#FEE2E2",
          color: machine.status === "active" ? "#065F46" : "#991B1B",
        }}>
          {machine.status}
        </span>
      </div>

      {/* MAINTENANCE HISTORY */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottom: `2px solid ${colors.border}` }}>
        <h2 style={{ margin: 0, fontSize: isDesktop ? "1.2rem" : "1rem", fontWeight: "700", color: colors.darkText }}>
          {t('maintenance_history')}
        </h2>
        <Button variant="primary" size="md" onClick={() => setShowAddLogForm(!showAddLogForm)}>
          {showAddLogForm ? t('cancel') : t('add_log')}
        </Button>
      </div>

      {showAddLogForm && (
        <div style={formCard}>
          <h3 style={{ margin: `0 0 ${spacing.lg} 0`, fontSize: "1rem", fontWeight: "700", color: colors.darkText }}>
            {t('add_maintenance_log')}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: spacing.md }}>
            <Input type="text" placeholder={t('issue')} value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
            <Input type="text" placeholder={t('symptom')} value={symptom} onChange={(e) => setSymptom(e.target.value)} />
            <Input type="text" placeholder={t('action_taken')} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
            <Input type="text" placeholder={t('result')} value={result} onChange={(e) => setResult(e.target.value)} />
          </div>
          <Button variant="primary" size="md" onClick={handleSaveLog} style={{ marginTop: spacing.lg }} disabled={isSaving}>
            {isSaving ? t('saving') : t('save_maintenance_log')}
          </Button>
        </div>
      )}

      {maintenanceLogs.length === 0 ? (
        <div style={{ backgroundColor: colors.white, borderRadius: "12px", padding: spacing.xl, border: `1px solid ${colors.border}`, marginBottom: spacing.xl, textAlign: "center", color: colors.lightText }}>
          {t('no_maintenance')}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, marginBottom: spacing.xl }}>
          {maintenanceLogs.map((log) => (
            <div key={log.id} style={{
              backgroundColor: colors.white, borderRadius: "12px",
              padding: isDesktop ? spacing.xl : spacing.lg,
              border: `1px solid ${colors.border}`,
              borderLeft: `4px solid ${colors.primary}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md, flexWrap: "wrap", gap: spacing.sm }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: colors.darkText }}>
                  {log.issue_title}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", color: colors.lightText }}>🕐 {formatDateTime(log.created_at)}</span>
                  <span style={{ fontSize: "0.75rem", color: colors.lightText }}>👤 {log.created_by}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: spacing.md }}>
                {log.symptom && (
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.72rem", fontWeight: "700", color: colors.lightText, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('symptom')}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: colors.darkText }}>{log.symptom}</p>
                  </div>
                )}
                {log.action_taken && (
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.72rem", fontWeight: "700", color: colors.lightText, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('action_taken')}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: colors.darkText }}>{log.action_taken}</p>
                  </div>
                )}
                {log.result && (
                  <div>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.72rem", fontWeight: "700", color: colors.lightText, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('result')}</p>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: "999px",
                      fontSize: "0.75rem", fontWeight: "600",
                      backgroundColor: log.result.toLowerCase().includes("solv") || log.result.toLowerCase().includes("fix") ? "#D1FAE5" : "#FEF3C7",
                      color: log.result.toLowerCase().includes("solv") || log.result.toLowerCase().includes("fix") ? "#065F46" : "#92400E",
                    }}>{log.result}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PARTS USED */}
      <div style={{ marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottom: `2px solid ${colors.border}` }}>
        <h2 style={{ margin: 0, fontSize: isDesktop ? "1.2rem" : "1rem", fontWeight: "700", color: colors.darkText }}>
          📦 {t('parts_inventory')} — {t('recent_stock_transactions')}
        </h2>
      </div>

      {partTransactions.length === 0 ? (
        <div style={{ backgroundColor: colors.white, borderRadius: "12px", padding: spacing.xl, border: `1px solid ${colors.border}`, marginBottom: spacing.xl, textAlign: "center", color: colors.lightText }}>
          {t('no_transactions')}
        </div>
      ) : (
        <div style={{ backgroundColor: colors.white, borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: spacing.xl }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                {[t('part_name'), t('part_code'), "Type", t('stock'), "Note", t('by'), "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: spacing.md, fontSize: "0.82rem", fontWeight: "600", color: colors.darkText }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.parts?.part_name || "—"}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.parts?.part_code || "—"}</td>
                  <td style={{ padding: spacing.md }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", backgroundColor: tx.transaction_type === "IN" ? "#D1FAE5" : "#FEE2E2", color: tx.transaction_type === "IN" ? "#065F46" : "#991B1B" }}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.qty}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.note || "—"}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.created_by || "—"}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.75rem", color: colors.lightText }}>{formatDateTime(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONSUMABLES USED */}
      <div style={{ marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottom: `2px solid ${colors.border}` }}>
        <h2 style={{ margin: 0, fontSize: isDesktop ? "1.2rem" : "1rem", fontWeight: "700", color: colors.darkText }}>
          🧵 {t('consumables')} — {t('recent_stock_transactions')}
        </h2>
      </div>

      {consumableTransactions.length === 0 ? (
        <div style={{ backgroundColor: colors.white, borderRadius: "12px", padding: spacing.xl, border: `1px solid ${colors.border}`, marginBottom: spacing.xl, textAlign: "center", color: colors.lightText }}>
          {t('no_transactions')}
        </div>
      ) : (
        <div style={{ backgroundColor: colors.white, borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: spacing.xl }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                {[t('name'), "Type", t('stock'), t('unit'), "Note", t('by'), "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: spacing.md, fontSize: "0.82rem", fontWeight: "600", color: colors.darkText }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consumableTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.consumables?.name || "—"}</td>
                  <td style={{ padding: spacing.md }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", backgroundColor: tx.transaction_type === "IN" ? "#D1FAE5" : "#FEE2E2", color: tx.transaction_type === "IN" ? "#065F46" : "#991B1B" }}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.qty}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.unit || "—"}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.note || "—"}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.85rem", color: colors.darkText }}>{tx.created_by || "—"}</td>
                  <td style={{ padding: spacing.md, fontSize: "0.75rem", color: colors.lightText }}>{formatDateTime(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </AppLayout>
  );
}

export default MachinePage;