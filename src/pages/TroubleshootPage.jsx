import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function TroubleshootPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  async function performSearch() {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select(`
        *,
        machines (
          machine_code
        )
      `)
      .or(`issue_title.ilike.%${searchQuery}%,symptom.ilike.%${searchQuery}%,action_taken.ilike.%${searchQuery}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setResults([]);
    } else {
      setResults(data || []);
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Back to Factories
      </button>

      <h1>Troubleshooting Search</h1>
      <p>Search past maintenance issues by title, symptom, or action taken.</p>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Enter search term..."
        style={{
          width: "400px",
          padding: "15px",
          fontSize: "18px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "20px"
        }}
      />

      <div>
        {results.length === 0 && searchQuery.trim().length > 2 && (
          <p>No results found.</p>
        )}
        {results.map((log) => (
          <div
            key={log.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "20px"
            }}
          >
            <p><strong>Machine Code:</strong> {log.machines?.machine_code || "N/A"}</p>
            <p><strong>Issue Title:</strong> {log.issue_title}</p>
            <p><strong>Symptom:</strong> {log.symptom}</p>
            <p><strong>Action Taken:</strong> {log.action_taken}</p>
            <p><strong>Result:</strong> {log.result}</p>
            <p><strong>Created At:</strong> {new Date(log.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TroubleshootPage;