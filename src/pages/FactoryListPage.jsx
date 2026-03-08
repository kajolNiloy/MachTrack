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
        padding: "40px",
        fontFamily: "Arial",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh"
      }}
    >
      <h1>MachTrack</h1>
      <p>Factory Parts Inventory System</p>

      <h2 style={{ marginTop: "30px" }}>Factories</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        {factories.map((factory) => (
          <div
            key={factory.id}
            onClick={() => navigate(`/factory/${factory.id}`)}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer"
            }}
          >
            <h3>{factory.name}</h3>
            <p>Code: {factory.code}</p>
            <p>Location: {factory.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FactoryListPage;