import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import Input from "../components/Input";
import Card from "../components/Card";
import { colors, spacing, typography } from "../constants/designTokens";

function TroubleshootPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

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
    <AppLayout>
      <h2 style={{ ...typography.sectionTitle, margin: `0 0 ${spacing.sm} 0`, color: colors.darkText }}>Troubleshooting Search</h2>
      <p style={{ margin: `0 0 ${spacing.xl} 0`, ...typography.body, color: colors.lightText }}>Search past maintenance issues by title, symptom, or action taken.</p>

      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Enter search term..."
        style={{ width: "400px", marginBottom: spacing.xl }}
      />

      <div>
        {results.length === 0 && searchQuery.trim().length > 2 && (
          <p style={{ color: colors.lightText, ...typography.body }}>No results found.</p>
        )}
        {results.map((log) => (
          <Card key={log.id} style={{ marginBottom: spacing.lg }}>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Machine Code:</strong> {log.machines?.machine_code || "N/A"}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Issue Title:</strong> {log.issue_title}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Symptom:</strong> {log.symptom}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Action Taken:</strong> {log.action_taken}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Result:</strong> {log.result}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Created At:</strong> {new Date(log.created_at).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}

export default TroubleshootPage;