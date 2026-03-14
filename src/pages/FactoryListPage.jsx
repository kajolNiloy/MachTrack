import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import { colors, spacing, typography } from "../constants/designTokens";
import { getDisplayFactoryName } from "../lib/factoryNames";

function FactoryListPage() {
  const [factories, setFactories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFactories();
  }, []);

  async function fetchFactories() {
    const { data, error } = await supabase
      .from("factories")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setFactories(data);
  }

  return (
    <AppLayout>
      <div style={{ paddingRight: 0, marginRight: 0 }}>
        <h2 style={{ ...typography.sectionTitle, margin: `0 0 ${spacing.xl} 0`, color: colors.darkText, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md }}>Factories</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: spacing.lg,
            width: "100%"
          }}
        >
        {factories.map((factory) => (
          <Card
            key={factory.id}
            onClick={() => navigate(`/factory/${factory.id}`)}
            style={{
              cursor: "pointer",
              transition: '150ms ease-in-out',
              padding: spacing.lg
            }}
          >
            <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.sm} 0`, color: colors.darkText, fontSize: '1.1rem' }}>{getDisplayFactoryName(factory.name)}</h3>
            <p style={{ margin: `${spacing.xs} 0`, ...typography.small, color: colors.lightText }}>Code: {factory.code}</p>
            <p style={{ margin: `${spacing.xs} 0`, ...typography.small, color: colors.lightText }}>Location: {factory.location}</p>
          </Card>
        ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default FactoryListPage;
