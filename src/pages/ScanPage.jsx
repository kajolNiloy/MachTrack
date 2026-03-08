import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function ScanPage() {
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanType, setScanType] = useState("");
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const navigate = useNavigate();

  async function handleScan(e) {
    const value = e.target.value;
    setScanCode(value);

    // Clear previous results
    setScanResult(null);
    setScanType("");
    setMaintenanceLogs([]);
    setStockTransactions([]);

    if (value.startsWith("M-")) {
      const machineCode = value.replace("M-", "");

      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("machine_code", machineCode)
        .single();

      if (error) {
        setScanType("machine");
        return;
      }

      setScanType("machine");
      setScanResult(data);

      // Fetch maintenance logs
      const { data: logs, error: logsError } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("machine_id", data.id)
        .order("created_at", { ascending: false });

      if (!logsError) {
        setMaintenanceLogs(logs || []);
      }

      // Fetch recent stock transactions
      const { data: trans, error: transError } = await supabase
        .from("stock_transactions")
        .select("*")
        .eq("machine_id", data.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!transError) {
        setStockTransactions(trans || []);
      }
    }

    if (value.startsWith("P-")) {
      const partCode = value.replace("P-", "");

      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .eq("part_code", partCode)
        .single();

      if (error) {
        setScanType("part");
        return;
      }

      setScanType("part");
      setScanResult(data);

      // Fetch recent stock transactions
      const { data: trans, error: transError } = await supabase
        .from("stock_transactions")
        .select("*")
        .eq("part_id", data.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!transError) {
        setStockTransactions(trans || []);
      }
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Scan QR Code</h1>
      <p>Scan machine or part QR code using the scanner.</p>

      <input
        type="text"
        autoFocus
        value={scanCode}
        onChange={handleScan}
        placeholder="Scan code here..."
        style={{
          width: "400px",
          padding: "15px",
          fontSize: "18px",
          borderRadius: "8px",
          border: "1px solid #ccc"
        }}
      />

      <div style={{ marginTop: "30px" }}>
        {scanType === "machine" && scanResult && (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            <h2>Machine Found</h2>
            <p><strong>Code:</strong> {scanResult.machine_code}</p>
            <p><strong>Name:</strong> {scanResult.machine_name}</p>
            <p><strong>Status:</strong> {scanResult.status}</p>

            <button
              onClick={() => navigate(`/factory/${scanResult.factory_id}`)}
              style={{
                marginTop: "10px",
                padding: "10px 16px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Open Factory Page
            </button>

            {maintenanceLogs.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3>Maintenance Logs</h3>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {maintenanceLogs.map(log => (
                    <li key={log.id} style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}>
                      {log.description} - {new Date(log.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stockTransactions.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3>Recent Stock Transactions</h3>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {stockTransactions.map(trans => (
                    <li key={trans.id} style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}>
                      {trans.type} {trans.quantity} - {new Date(trans.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {scanType === "part" && scanResult && (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            <h2>Part Found</h2>
            <p><strong>Code:</strong> {scanResult.part_code}</p>
            <p><strong>Name:</strong> {scanResult.part_name}</p>
            <p><strong>Stock:</strong> {scanResult.current_stock}</p>
            <p><strong>Location:</strong> {scanResult.location}</p>

            <button
              onClick={() => navigate(`/factory/${scanResult.factory_id}`)}
              style={{
                marginTop: "10px",
                padding: "10px 16px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Open Factory Page
            </button>

            {stockTransactions.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3>Recent Stock Transactions</h3>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {stockTransactions.map(trans => (
                    <li key={trans.id} style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}>
                      {trans.type} {trans.quantity} - {new Date(trans.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {scanCode && !scanResult && (
          <p style={{ color: "red", marginTop: "20px" }}>No matching record found.</p>
        )}
      </div>
    </div>
  );
}

export default ScanPage;