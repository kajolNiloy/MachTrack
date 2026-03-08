import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function FactoryDetailPage() {
  const { id } = useParams();

  const [factory, setFactory] = useState(null);
  const [machines, setMachines] = useState([]);
  const [parts, setParts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [showAddPartForm, setShowAddPartForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPart, setSelectedPart] = useState(null);
  const [showUsePartForm, setShowUsePartForm] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [useQty, setUseQty] = useState("");
  const [useNote, setUseNote] = useState("");

  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [addStockPart, setAddStockPart] = useState(null);
  const [addQty, setAddQty] = useState("");
  const [addNote, setAddNote] = useState("");

  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceMachineId, setMaintenanceMachineId] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [symptom, setSymptom] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [result, setResult] = useState("");

  const [partCode, setPartCode] = useState("");
  const [partName, setPartName] = useState("");
  const [category, setCategory] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [location, setLocation] = useState("");
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    fetchFactory();
    fetchMachines();
    fetchParts();
    fetchTransactions();
    fetchMaintenanceLogs();
  }, []);

  async function fetchFactory() {
    const { data, error } = await supabase
      .from("factories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setFactory(data);
  }

  async function fetchMachines() {
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .eq("factory_id", id)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setMachines(data);
  }

  async function fetchParts() {
    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("factory_id", id)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setParts(data);
  }

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from("stock_transactions")
      .select("*")
      .eq("factory_id", id)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTransactions(data);
  }

  async function fetchMaintenanceLogs() {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("factory_id", id)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setMaintenanceLogs(data);
  }

  async function handleSavePart() {
    if (!partCode || !partName) {
      alert("Please enter Part Code and Part Name");
      return;
    }

    const { error } = await supabase.from("parts").insert([
      {
        factory_id: Number(id),
        part_code: partCode,
        part_name: partName,
        category: category,
        current_stock: Number(currentStock) || 0,
        min_stock: Number(minStock) || 0,
        location: location,
        qr_code: qrCode || null
      }
    ]);

    if (error) {
      console.error(error);
      alert("Failed to save part");
      return;
    }

    alert("Part saved successfully");

    setPartCode("");
    setPartName("");
    setCategory("");
    setCurrentStock("");
    setMinStock("");
    setLocation("");
    setQrCode("");
    setShowAddPartForm(false);

    fetchParts();
  }

  function openUsePartForm(part) {
    setSelectedPart(part);
    setSelectedMachineId("");
    setUseQty("");
    setUseNote("");
    setShowUsePartForm(true);
  }

  function openAddStockForm(part) {
    setAddStockPart(part);
    setAddQty("");
    setAddNote("");
    setShowAddStockForm(true);
  }

  async function handleSaveUsage() {
    if (!selectedPart) {
      alert("No part selected");
      return;
    }

    if (!selectedMachineId || !useQty) {
      alert("Please select machine and quantity");
      return;
    }

    const qtyNumber = Number(useQty);

    if (qtyNumber <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (qtyNumber > selectedPart.current_stock) {
      alert("Not enough stock");
      return;
    }

    const newStock = selectedPart.current_stock - qtyNumber;

    const { error: updateError } = await supabase
      .from("parts")
      .update({ current_stock: newStock })
      .eq("id", selectedPart.id);

    if (updateError) {
      console.error(updateError);
      alert("Failed to update stock");
      return;
    }

    const { error: transactionError } = await supabase
      .from("stock_transactions")
      .insert([
        {
          factory_id: Number(id),
          part_id: selectedPart.id,
          machine_id: Number(selectedMachineId),
          transaction_type: "OUT",
          qty: qtyNumber,
          note: useNote,
          created_by: "Kajol"
        }
      ]);

    if (transactionError) {
      console.error(transactionError);
      alert("Stock updated but transaction save failed");
      return;
    }

    alert("Part usage saved successfully");

    setShowUsePartForm(false);
    setSelectedPart(null);
    setSelectedMachineId("");
    setUseQty("");
    setUseNote("");

    fetchParts();
    fetchTransactions();
  }

  async function handleSaveAddStock() {
    if (!addStockPart) {
      alert("No part selected");
      return;
    }

    const qtyNumber = Number(addQty);

    if (qtyNumber <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const newStock = addStockPart.current_stock + qtyNumber;

    const { error: updateError } = await supabase
      .from("parts")
      .update({ current_stock: newStock })
      .eq("id", addStockPart.id);

    if (updateError) {
      console.error(updateError);
      alert("Failed to update stock");
      return;
    }

    const { error: transactionError } = await supabase
      .from("stock_transactions")
      .insert([
        {
          factory_id: Number(id),
          part_id: addStockPart.id,
          machine_id: null,
          transaction_type: "IN",
          qty: qtyNumber,
          note: addNote,
          created_by: "Kajol"
        }
      ]);

    if (transactionError) {
      console.error(transactionError);
      alert("Stock updated but transaction save failed");
      return;
    }

    alert("Stock added successfully");

    setShowAddStockForm(false);
    setAddStockPart(null);
    setAddQty("");
    setAddNote("");

    fetchParts();
    fetchTransactions();
  }

  async function handleSaveMaintenance() {
    if (!maintenanceMachineId || !issueTitle) {
      alert("Please select machine and enter issue title");
      return;
    }

    const { error } = await supabase.from("maintenance_logs").insert([
      {
        factory_id: Number(id),
        machine_id: Number(maintenanceMachineId),
        issue_title: issueTitle,
        symptom: symptom,
        action_taken: actionTaken,
        result: result,
        created_by: "Kajol"
      }
    ]);

    if (error) {
      console.error(error);
      alert("Failed to save maintenance log");
      return;
    }

    alert("Maintenance log saved successfully");

    setMaintenanceMachineId("");
    setIssueTitle("");
    setSymptom("");
    setActionTaken("");
    setResult("");
    setShowMaintenanceForm(false);

    fetchMaintenanceLogs();
  }

  function getPartName(partId) {
    const part = parts.find((p) => p.id === partId);
    return part ? part.part_name : `Part ID: ${partId}`;
  }

  function getMachineCode(machineId) {
    if (!machineId) return "-";
    const machine = machines.find((m) => m.id === machineId);
    return machine ? machine.machine_code : `Machine ID: ${machineId}`;
  }

  const filteredParts = parts.filter((part) => {
    const term = searchTerm.toLowerCase();
    return (
      part.part_name?.toLowerCase().includes(term) ||
      part.part_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh"
      }}
    >
      <Link to="/" style={{ textDecoration: "none", color: "#2563eb" }}>
        ← Back to Factories
      </Link>

      {!factory ? (
        <p style={{ marginTop: "20px" }}>Loading factory...</p>
      ) : (
        <>
          <h1 style={{ marginTop: "20px" }}>{factory.name}</h1>
          <p>Code: {factory.code}</p>
          <p>Location: {factory.location}</p>

          <h2 style={{ marginTop: "30px" }}>Machines</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "20px"
            }}
          >
            {machines.map((machine) => (
              <div
                key={machine.id}
                style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                <h3 style={{ marginTop: 0 }}>{machine.machine_code}</h3>
                <p>{machine.machine_name}</p>
                <p>Status: {machine.status}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "40px"
            }}
          >
            <h2>Parts Inventory</h2>

            <button
              onClick={() => setShowAddPartForm(!showAddPartForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Add Part
            </button>
          </div>

          <input
            type="text"
            placeholder="Search part name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px",
              width: "300px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              marginTop: "12px",
              marginBottom: "10px"
            }}
          />

          {showAddPartForm && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                marginTop: "20px"
              }}
            >
              <h3>Add New Part</h3>

              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <input type="text" placeholder="Part Code" value={partCode} onChange={(e) => setPartCode(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <input type="text" placeholder="Part Name" value={partName} onChange={(e) => setPartName(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <input type="number" placeholder="Current Stock" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <input type="number" placeholder="Minimum Stock" value={minStock} onChange={(e) => setMinStock(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                <input type="text" placeholder="QR Code" value={qrCode} onChange={(e) => setQrCode(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />

                <button
                  onClick={handleSavePart}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Save Part
                </button>
              </div>
            </div>
          )}

          {showUsePartForm && selectedPart && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                marginTop: "20px"
              }}
            >
              <h3>Use Part</h3>
              <p><strong>Part:</strong> {selectedPart.part_name}</p>
              <p><strong>Current Stock:</strong> {selectedPart.current_stock}</p>

              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_code}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity to use"
                  value={useQty}
                  onChange={(e) => setUseQty(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <input
                  type="text"
                  placeholder="Note"
                  value={useNote}
                  onChange={(e) => setUseNote(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <button
                  onClick={handleSaveUsage}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Save Usage
                </button>
              </div>
            </div>
          )}

          {showAddStockForm && addStockPart && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                marginTop: "20px"
              }}
            >
              <h3>Add Stock</h3>
              <p><strong>Part:</strong> {addStockPart.part_name}</p>
              <p><strong>Current Stock:</strong> {addStockPart.current_stock}</p>

              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <input
                  type="number"
                  placeholder="Quantity to add"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <input
                  type="text"
                  placeholder="Note"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <button
                  onClick={handleSaveAddStock}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Save Add Stock
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginTop: "20px"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px" }}>Part Code</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Part Name</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Stock</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Min Stock</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredParts.map((part) => (
                  <tr
                    key={part.id}
                    style={{
                      backgroundColor:
                        part.current_stock <= part.min_stock ? "#ffe5e5" : "white"
                    }}
                  >
                    <td style={{ padding: "10px" }}>{part.part_code}</td>
                    <td style={{ padding: "10px" }}>{part.part_name}</td>
                    <td style={{ padding: "10px" }}>{part.category}</td>
                    <td style={{ padding: "10px" }}>{part.current_stock}</td>
                    <td style={{ padding: "10px" }}>{part.min_stock}</td>
                    <td style={{ padding: "10px" }}>{part.location}</td>

                    <td style={{ padding: "10px" }}>
                      <button
                        onClick={() => openUsePartForm(part)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          marginRight: "8px"
                        }}
                      >
                        Use
                      </button>

                      <button
                        onClick={() => openAddStockForm(part)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: "40px" }}>Recent Stock Transactions</h2>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginTop: "20px"
            }}
          >
            {transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px" }}>Part Name</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Machine</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Note</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td style={{ padding: "10px" }}>{getPartName(transaction.part_id)}</td>
                      <td style={{ padding: "10px" }}>{getMachineCode(transaction.machine_id)}</td>
                      <td style={{ padding: "10px" }}>{transaction.transaction_type}</td>
                      <td style={{ padding: "10px" }}>{transaction.qty}</td>
                      <td style={{ padding: "10px" }}>{transaction.note}</td>
                      <td style={{ padding: "10px" }}>{transaction.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "40px"
            }}
          >
            <h2>Maintenance History</h2>

            <button
              onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Add Maintenance Log
            </button>
          </div>

          {showMaintenanceForm && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                marginTop: "20px"
              }}
            >
              <h3>Add Maintenance Log</h3>

              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <select
                  value={maintenanceMachineId}
                  onChange={(e) => setMaintenanceMachineId(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_code}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Issue Title"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <input
                  type="text"
                  placeholder="Symptom"
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <input
                  type="text"
                  placeholder="Action Taken"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <input
                  type="text"
                  placeholder="Result"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                />

                <button
                  onClick={handleSaveMaintenance}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Save Maintenance Log
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginTop: "20px"
            }}
          >
            {maintenanceLogs.length === 0 ? (
              <p>No maintenance logs found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px" }}>Machine</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Issue</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Symptom</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Action</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>Result</th>
                    <th style={{ textAlign: "left", padding: "10px" }}>By</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ padding: "10px" }}>{getMachineCode(log.machine_id)}</td>
                      <td style={{ padding: "10px" }}>{log.issue_title}</td>
                      <td style={{ padding: "10px" }}>{log.symptom}</td>
                      <td style={{ padding: "10px" }}>{log.action_taken}</td>
                      <td style={{ padding: "10px" }}>{log.result}</td>
                      <td style={{ padding: "10px" }}>{log.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FactoryDetailPage;