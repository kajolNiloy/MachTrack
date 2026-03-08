import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

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
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "24px"
      }}
    >
      <h1 style={{ margin: "0 0 8px 0", fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>MachTrack</h1>
      <p style={{ margin: "0 0 32px 0", fontSize: "0.875rem", color: "#6b7280" }}>Factory Parts Inventory System</p>

      <h2 style={{ margin: "0 0 24px 0", fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>Factories</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px"
        }}
      >
        {factories.map((factory) => (
          <div
            key={factory.id}
            onClick={() => navigate(`/factory/${factory.id}`)}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
              cursor: "pointer"
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>{factory.name}</h3>
            <p style={{ margin: "4px 0", fontSize: "0.875rem", color: "#6b7280" }}>Code: {factory.code}</p>
            <p style={{ margin: "4px 0", fontSize: "0.875rem", color: "#6b7280" }}>Location: {factory.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FactoryListPage;