import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { colors, spacing, typography, borderRadius, shadows } from "../constants/designTokens";
import { getDisplayFactoryName } from "../lib/factoryNames";

const KURACHI_FACTORY_NAME = "\u5009\u77e5\u5de5\u5834";
const KURACHI_MACHINE_PRESETS = [
  { machine_code: "KRC-001", machine_name: "\u7e2b\u88fd\u6a5f" },
  { machine_code: "KRC-002", machine_name: "\u30ab\u30e1\u30e9NC\u30ab\u30c3\u30c8\u6a5f" },
  { machine_code: "KRC-003", machine_name: "\u30ec\u30fc\u30b6\u30ab\u30c3\u30c8\u6a5f" },
  { machine_code: "KRC-004", machine_name: "NC\u30ab\u30c3\u30c8\u6a5f" },
  { machine_code: "KRC-005", machine_name: "3D \u30d7\u30ea\u30f3\u30bf" }
];

const PART_PREVIEW_LIBRARY = {
  belt: {
    imageUrl: "/images/parts/belt.svg",
    description: "Drive belt used to transfer rotational power between machine pulleys.",
    measurement: "Example size: Length 900 mm, Width 15 mm, Thickness 10 mm"
  }
};
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
  const [isAddingKurachiMachines, setIsAddingKurachiMachines] = useState(false);
  const [previewPart, setPreviewPart] = useState(null);

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

  async function handleAddKurachiMachines() {
    if (!factory) return;

    const existingCodes = new Set(machines.map((machine) => machine.machine_code));
    const machinesToInsert = KURACHI_MACHINE_PRESETS
      .filter((machine) => !existingCodes.has(machine.machine_code))
      .map((machine) => ({
        factory_id: Number(id),
        machine_code: machine.machine_code,
        machine_name: machine.machine_name,
        status: "active"
      }));

    if (machinesToInsert.length === 0) {
      alert("Kurachi factory machines are already added.");
      return;
    }

    setIsAddingKurachiMachines(true);
    const { error } = await supabase.from("machines").insert(machinesToInsert);
    setIsAddingKurachiMachines(false);

    if (error) {
      console.error(error);
      alert("Failed to add machines");
      return;
    }

    alert(`${machinesToInsert.length} machine(s) added to 倉知工場`);
    fetchMachines();
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

  function getPartPreview(part) {
    const normalizedPartName = (part?.part_name || "").toLowerCase();
    const isBelt = normalizedPartName.includes("belt") || normalizedPartName.includes("ベルト");
    const preset = isBelt ? PART_PREVIEW_LIBRARY.belt : null;

    return {
      imageUrl: part?.image_url || preset?.imageUrl || "",
      description:
        part?.description ||
        preset?.description ||
        "No description saved for this part.",
      measurement:
        part?.measurement ||
        preset?.measurement ||
        "No measurement saved for this part."
    };
  }

  const filteredParts = parts.filter((part) => {
    const term = searchTerm.toLowerCase();
    return (
      part.part_name?.toLowerCase().includes(term) ||
      part.part_code?.toLowerCase().includes(term)
    );
  });
  const previewPartData = previewPart ? getPartPreview(previewPart) : null;
  const displayFactoryName = factory ? getDisplayFactoryName(factory.name) : "";
  const isKurachiFactory = displayFactoryName === KURACHI_FACTORY_NAME;

  return (
    <AppLayout>
      {!factory ? (
        <p style={{ ...typography.body, color: colors.lightText }}>Loading factory...</p>
      ) : (
        <>
          <h1 style={{ ...typography.pageTitle, margin: `0 0 ${spacing.md} 0`, color: colors.darkText }}>{displayFactoryName}</h1>
          <p style={{ ...typography.body, color: colors.mediumText, margin: `${spacing.xs} 0 ${spacing.xl} 0` }}>Code: {factory.code} • Location: {factory.location}</p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: spacing.xl,
              marginBottom: spacing.lg
            }}
          >
            <h2 style={{ ...typography.sectionTitle, margin: 0, color: colors.darkText, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md, flex: 1 }}>Machines</h2>
            {isKurachiFactory && (
              <Button
                variant="primary"
                size="md"
                onClick={handleAddKurachiMachines}
                disabled={isAddingKurachiMachines}
                style={{ marginLeft: spacing.lg }}
              >
                {isAddingKurachiMachines ? "Adding..." : "Add Kurachi Machines"}
              </Button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: spacing.lg,
              marginBottom: spacing.xxxl
            }}
          >
            {machines.map((machine) => (
              <Card key={machine.id}>
                <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.sm} 0`, color: colors.darkText }}>{machine.machine_code}</h3>
                <p style={{ ...typography.body, color: colors.lightText, margin: spacing.xs }}>{machine.machine_name}</p>
                <p style={{ ...typography.small, color: colors.mediumText, margin: spacing.xs }}>Status: <strong>{machine.status}</strong></p>
              </Card>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.lg
            }}
          >
            <h2 style={{ ...typography.sectionTitle, margin: 0, color: colors.darkText, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md, flex: 1 }}>Parts Inventory</h2>
            <Button variant="primary" size="md" onClick={() => setShowAddPartForm(!showAddPartForm)}>Add Part</Button>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <Input
              type="text"
              placeholder="Search part name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "350px" }}
            />
          </div>

          {showAddPartForm && (
            <Card style={{ marginBottom: spacing.lg }}>
              <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText }}>Add New Part</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.lg }}>
                <Input type="text" placeholder="Part Code" value={partCode} onChange={(e) => setPartCode(e.target.value)} />
                <Input type="text" placeholder="Part Name" value={partName} onChange={(e) => setPartName(e.target.value)} />
                <Input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
                <Input type="number" placeholder="Current Stock" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} />
                <Input type="number" placeholder="Minimum Stock" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                <Input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                <Input type="text" placeholder="QR Code" value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
              </div>

              <Button variant="success" size="md" onClick={handleSavePart} style={{ marginTop: spacing.lg }}>Save Part</Button>
            </Card>
          )}

          {showUsePartForm && selectedPart && (
            <Card style={{ marginBottom: spacing.lg }}>
              <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText }}>Use Part</h3>
              <p style={{ ...typography.body, color: colors.darkText, marginBottom: spacing.md }}><strong>Part:</strong> {selectedPart.part_name}</p>
              <p style={{ ...typography.body, color: colors.darkText, marginBottom: spacing.lg }}><strong>Current Stock:</strong> {selectedPart.current_stock}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.lg }}>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  style={{ padding: spacing.md, borderRadius: borderRadius.md, border: `1px solid ${colors.border}`, fontSize: '0.875rem' }}
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_code}
                    </option>
                  ))}
                </select>
                <Input type="number" placeholder="Quantity to use" value={useQty} onChange={(e) => setUseQty(e.target.value)} />
                <Input type="text" placeholder="Note" value={useNote} onChange={(e) => setUseNote(e.target.value)} />
              </div>

              <Button variant="danger" size="md" onClick={handleSaveUsage} style={{ marginTop: spacing.lg }}>Save Usage</Button>
            </Card>
          )}

          {showAddStockForm && addStockPart && (
            <Card style={{ marginBottom: spacing.lg }}>
              <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText }}>Add Stock</h3>
              <p style={{ ...typography.body, color: colors.darkText, marginBottom: spacing.md }}><strong>Part:</strong> {addStockPart.part_name}</p>
              <p style={{ ...typography.body, color: colors.darkText, marginBottom: spacing.lg }}><strong>Current Stock:</strong> {addStockPart.current_stock}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.lg }}>
                <Input type="number" placeholder="Quantity to add" value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                <Input type="text" placeholder="Note" value={addNote} onChange={(e) => setAddNote(e.target.value)} />
              </div>

              <Button variant="success" size="md" onClick={handleSaveAddStock} style={{ marginTop: spacing.lg }}>Save Add Stock</Button>
            </Card>
          )}

          <Card style={{ marginBottom: spacing.xxxl, overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Part Code</th>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Part Name</th>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Category</th>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Stock</th>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Min Stock</th>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Location</th>
                  <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredParts.map((part) => (
                  <tr
                    key={part.id}
                    style={{
                      backgroundColor: part.current_stock <= part.min_stock ? '#fee2e2' : colors.white,
                      borderBottom: `1px solid ${colors.border}`
                    }}
                  >
                    <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{part.part_code}</td>
                    <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>
                      <button
                        type="button"
                        onClick={() => setPreviewPart(part)}
                        style={{
                          padding: 0,
                          margin: 0,
                          border: "none",
                          background: "transparent",
                          color: colors.primary,
                          cursor: "pointer",
                          textAlign: "left",
                          textDecoration: "underline",
                          fontSize: "inherit",
                          fontFamily: "inherit"
                        }}
                      >
                        {part.part_name}
                      </button>
                    </td>
                    <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{part.category}</td>
                    <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}><strong>{part.current_stock}</strong></td>
                    <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{part.min_stock}</td>
                    <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{part.location}</td>

                    <td style={{ padding: spacing.md }}>
                      <Button variant="danger" size="sm" onClick={() => openUsePartForm(part)} style={{ marginRight: spacing.xs }}>Use</Button>
                      <Button variant="success" size="sm" onClick={() => openAddStockForm(part)}>Add</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {previewPart && previewPartData && (
            <div
              onClick={() => setPreviewPart(null)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: spacing.lg
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(560px, 100%)",
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.lg,
                  padding: spacing.xl
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                  <h3 style={{ margin: 0, ...typography.cardTitle, color: colors.darkText }}>{previewPart.part_name}</h3>
                  <Button variant="secondary" size="sm" onClick={() => setPreviewPart(null)}>Close</Button>
                </div>
                {previewPartData.imageUrl ? (
                  <img
                    src={previewPartData.imageUrl}
                    alt={previewPart.part_name}
                    style={{
                      width: "100%",
                      maxHeight: "260px",
                      objectFit: "cover",
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.md
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "180px",
                      borderRadius: borderRadius.md,
                      border: `1px dashed ${colors.border}`,
                      backgroundColor: colors.background,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.lightText,
                      marginBottom: spacing.md
                    }}
                  >
                    No image available
                  </div>
                )}
                <p style={{ margin: `0 0 ${spacing.sm} 0`, ...typography.body, color: colors.darkText }}>
                  <strong>Description:</strong> {previewPartData.description}
                </p>
                <p style={{ margin: 0, ...typography.body, color: colors.mediumText }}>
                  <strong>Measurement:</strong> {previewPartData.measurement}
                </p>
              </div>
            </div>
          )}

          <h2 style={{ ...typography.sectionTitle, margin: `${spacing.xl} 0 ${spacing.lg} 0`, color: colors.darkText, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md }}>Recent Stock Transactions</h2>

          <Card style={{ marginBottom: spacing.xxxl, overflowX: 'auto' }}>
            {transactions.length === 0 ? (
              <p style={{ ...typography.body, color: colors.lightText }}>No transactions found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Part Name</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Machine</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Type</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Qty</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Note</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{getPartName(transaction.part_id)}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{getMachineCode(transaction.machine_id)}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}><strong>{transaction.transaction_type}</strong></td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{transaction.qty}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{transaction.note}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{transaction.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.lg
            }}
          >
            <h2 style={{ ...typography.sectionTitle, margin: 0, color: colors.darkText, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md, flex: 1 }}>Maintenance History</h2>
            <Button variant="maintenance" size="md" onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}>Add Log</Button>
          </div>

          {showMaintenanceForm && (
            <Card style={{ marginBottom: spacing.lg }}>
              <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText }}>Add Maintenance Log</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.lg }}>
                <select
                  value={maintenanceMachineId}
                  onChange={(e) => setMaintenanceMachineId(e.target.value)}
                  style={{ padding: spacing.md, borderRadius: borderRadius.md, border: `1px solid ${colors.border}`, fontSize: '0.875rem' }}
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_code}
                    </option>
                  ))}
                </select>
                <Input type="text" placeholder="Issue Title" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
                <Input type="text" placeholder="Symptom" value={symptom} onChange={(e) => setSymptom(e.target.value)} />
                <Input type="text" placeholder="Action Taken" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
                <Input type="text" placeholder="Result" value={result} onChange={(e) => setResult(e.target.value)} />
              </div>

              <Button variant="maintenance" size="md" onClick={handleSaveMaintenance} style={{ marginTop: spacing.lg }}>Save Maintenance Log</Button>
            </Card>
          )}

          <Card style={{ overflowX: 'auto' }}>
            {maintenanceLogs.length === 0 ? (
              <p style={{ ...typography.body, color: colors.lightText }}>No maintenance logs found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Machine</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Issue</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Symptom</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Action</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>Result</th>
                    <th style={{ textAlign: "left", padding: spacing.md, ...typography.body, fontWeight: '600', color: colors.darkText }}>By</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{getMachineCode(log.machine_id)}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{log.issue_title}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{log.symptom}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{log.action_taken}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{log.result}</td>
                      <td style={{ padding: spacing.md, ...typography.small, color: colors.darkText }}>{log.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </AppLayout>
  );
}

export default FactoryDetailPage;

