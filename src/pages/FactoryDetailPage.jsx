import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { colors, spacing, typography, borderRadius, shadows } from "../constants/designTokens";

// Kurachi factory preset machines
const KURACHI_MACHINE_PRESETS = [
  { machine_code: "KRC-001", machine_name: "縫製機" },
  { machine_code: "KRC-002", machine_name: "カメラNCカット機" },
  { machine_code: "KRC-003", machine_name: "レーザカット機" },
  { machine_code: "KRC-004", machine_name: "NCカット機" },
  { machine_code: "KRC-005", machine_name: "3D プリンタ" }
];

const PART_PREVIEW_LIBRARY = {
  belt: {
    imageUrl: "/images/parts/belt.svg",
    description: "Drive belt used to transfer rotational power between machine pulleys.",
    measurement: "Example size: Length 900 mm, Width 15 mm, Thickness 10 mm"
  }
};

function SectionTitle({ children, action, isDesktop }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingBottom: spacing.md,
      borderBottom: `2px solid ${colors.border}`,
    }}>
      <h2 style={{
        margin: 0,
        fontSize: isDesktop ? '1.2rem' : '1rem',
        fontWeight: '700',
        color: colors.darkText,
      }}>{children}</h2>
      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2',
      color: isActive ? '#065F46' : '#991B1B',
    }}>
      {status}
    </span>
  );
}

function FactoryDetailPage() {
  const { id } = useParams();
  const device = useDeviceType();
  const isDesktop = device === 'desktop';
  const isMobile = device === 'mobile';

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
    const { data, error } = await supabase.from("factories").select("*").eq("id", id).single();
    if (!error) setFactory(data);
  }

  async function fetchMachines() {
    const { data, error } = await supabase.from("machines").select("*").eq("factory_id", id).order("id", { ascending: true });
    if (!error) setMachines(data);
  }

  async function fetchParts() {
    const { data, error } = await supabase.from("parts").select("*").eq("factory_id", id).order("id", { ascending: true });
    if (!error) setParts(data);
  }

  async function fetchTransactions() {
    const { data, error } = await supabase.from("stock_transactions").select("*").eq("factory_id", id).order("id", { ascending: false });
    if (!error) setTransactions(data);
  }

  async function fetchMaintenanceLogs() {
    const { data, error } = await supabase.from("maintenance_logs").select("*").eq("factory_id", id).order("id", { ascending: false });
    if (!error) setMaintenanceLogs(data);
  }

  async function handleSavePart() {
    if (!partCode || !partName) { alert("Please enter Part Code and Part Name"); return; }
    const { error } = await supabase.from("parts").insert([{
      factory_id: Number(id), part_code: partCode, part_name: partName,
      category, current_stock: Number(currentStock) || 0,
      min_stock: Number(minStock) || 0, location, qr_code: qrCode || null
    }]);
    if (error) { alert("Failed to save part"); return; }
    alert("Part saved successfully");
    setPartCode(""); setPartName(""); setCategory(""); setCurrentStock("");
    setMinStock(""); setLocation(""); setQrCode(""); setShowAddPartForm(false);
    fetchParts();
  }

  function openUsePartForm(part) {
    setSelectedPart(part); setSelectedMachineId(""); setUseQty(""); setUseNote(""); setShowUsePartForm(true);
  }

  function openAddStockForm(part) {
    setAddStockPart(part); setAddQty(""); setAddNote(""); setShowAddStockForm(true);
  }

  async function handleSaveUsage() {
    if (!selectedPart) { alert("No part selected"); return; }
    if (!selectedMachineId || !useQty) { alert("Please select machine and quantity"); return; }
    const qtyNumber = Number(useQty);
    if (qtyNumber <= 0) { alert("Quantity must be greater than 0"); return; }
    if (qtyNumber > selectedPart.current_stock) { alert("Not enough stock"); return; }
    const newStock = selectedPart.current_stock - qtyNumber;
    const { error: updateError } = await supabase.from("parts").update({ current_stock: newStock }).eq("id", selectedPart.id);
    if (updateError) { alert("Failed to update stock"); return; }
    const { error: transactionError } = await supabase.from("stock_transactions").insert([{
      factory_id: Number(id), part_id: selectedPart.id,
      machine_id: Number(selectedMachineId), transaction_type: "OUT",
      qty: qtyNumber, note: useNote, created_by: "Kajol"
    }]);
    if (transactionError) { alert("Stock updated but transaction save failed"); return; }
    alert("Part usage saved successfully");
    setShowUsePartForm(false); setSelectedPart(null); setSelectedMachineId(""); setUseQty(""); setUseNote("");
    fetchParts(); fetchTransactions();
  }

  async function handleSaveAddStock() {
    if (!addStockPart) { alert("No part selected"); return; }
    const qtyNumber = Number(addQty);
    if (qtyNumber <= 0) { alert("Quantity must be greater than 0"); return; }
    const newStock = addStockPart.current_stock + qtyNumber;
    const { error: updateError } = await supabase.from("parts").update({ current_stock: newStock }).eq("id", addStockPart.id);
    if (updateError) { alert("Failed to update stock"); return; }
    const { error: transactionError } = await supabase.from("stock_transactions").insert([{
      factory_id: Number(id), part_id: addStockPart.id, machine_id: null,
      transaction_type: "IN", qty: qtyNumber, note: addNote, created_by: "Kajol"
    }]);
    if (transactionError) { alert("Stock updated but transaction save failed"); return; }
    alert("Stock added successfully");
    setShowAddStockForm(false); setAddStockPart(null); setAddQty(""); setAddNote("");
    fetchParts(); fetchTransactions();
  }

  async function handleSaveMaintenance() {
    if (!maintenanceMachineId || !issueTitle) { alert("Please select machine and enter issue title"); return; }
    const { error } = await supabase.from("maintenance_logs").insert([{
      factory_id: Number(id), machine_id: Number(maintenanceMachineId),
      issue_title: issueTitle, symptom, action_taken: actionTaken,
      result, created_by: "Kajol"
    }]);
    if (error) { alert("Failed to save maintenance log"); return; }
    alert("Maintenance log saved successfully");
    setMaintenanceMachineId(""); setIssueTitle(""); setSymptom("");
    setActionTaken(""); setResult(""); setShowMaintenanceForm(false);
    fetchMaintenanceLogs();
  }

  async function handleAddKurachiMachines() {
    if (!factory) return;
    const existingCodes = new Set(machines.map((m) => m.machine_code));
    const machinesToInsert = KURACHI_MACHINE_PRESETS
      .filter((m) => !existingCodes.has(m.machine_code))
      .map((m) => ({ factory_id: Number(id), machine_code: m.machine_code, machine_name: m.machine_name, status: "active" }));
    if (machinesToInsert.length === 0) { alert("倉知工場のマシンはすでに追加されています。"); return; }
    setIsAddingKurachiMachines(true);
    const { error } = await supabase.from("machines").insert(machinesToInsert);
    setIsAddingKurachiMachines(false);
    if (error) { alert("Failed to add machines"); return; }
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
      description: part?.description || preset?.description || "No description saved for this part.",
      measurement: part?.measurement || preset?.measurement || "No measurement saved for this part."
    };
  }

  const filteredParts = parts.filter((part) => {
    const term = searchTerm.toLowerCase();
    return part.part_name?.toLowerCase().includes(term) || part.part_code?.toLowerCase().includes(term);
  });

  const previewPartData = previewPart ? getPartPreview(previewPart) : null;

  // Factory name comes directly from DB — no translation needed
  const isKurachiFactory = factory?.name === '倉知工場';

  // Shared form style
  const formCard = {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: spacing.xl,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: `1px solid ${colors.border}`,
    marginBottom: spacing.lg,
  };

  const selectStyle = {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    width: '100%',
    height: '42px',
    backgroundColor: colors.white,
    color: colors.darkText,
  };

  return (
    <AppLayout>
      {!factory ? (
        <p style={{ color: colors.lightText }}>Loading factory...</p>
      ) : (
        <>
          {/* Factory Header */}
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: isDesktop ? spacing.xl : spacing.lg,
            marginBottom: spacing.xl,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
          }}>
            <div style={{
              width: isDesktop ? '56px' : '44px',
              height: isDesktop ? '56px' : '44px',
              backgroundColor: '#EFF6FF',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isDesktop ? '1.6rem' : '1.3rem',
              flexShrink: 0,
            }}>🏭</div>
            <div>
              <h1 style={{ margin: 0, fontSize: isDesktop ? '1.5rem' : '1.2rem', fontWeight: '700', color: colors.darkText }}>
                {factory.name}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: colors.lightText }}>
                Code: {factory.code} · {factory.location}
              </p>
            </div>
          </div>

          {/* ── MACHINES ── */}
          <SectionTitle isDesktop={isDesktop} action={
            isKurachiFactory && (
              <Button variant="primary" size="md" onClick={handleAddKurachiMachines} disabled={isAddingKurachiMachines}>
                {isAddingKurachiMachines ? "Adding..." : "Add Kurachi Machines"}
              </Button>
            )
          }>
            Machines ({machines.length})
          </SectionTitle>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : isDesktop ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: spacing.md,
            marginBottom: spacing.xxxl,
          }}>
            {machines.map((machine) => (
              <div key={machine.id} style={{
                backgroundColor: colors.white,
                borderRadius: '10px',
                padding: spacing.md,
                border: `1px solid ${colors.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: colors.darkText }}>{machine.machine_code}</p>
                <p style={{ margin: '4px 0', fontSize: '0.8rem', color: colors.mediumText }}>{machine.machine_name}</p>
                <StatusBadge status={machine.status} />
              </div>
            ))}
          </div>

          {/* ── PARTS INVENTORY ── */}
          <SectionTitle isDesktop={isDesktop} action={
            <Button variant="primary" size="md" onClick={() => setShowAddPartForm(!showAddPartForm)}>
              {showAddPartForm ? 'Cancel' : '+ Add Part'}
            </Button>
          }>
            Parts Inventory ({filteredParts.length})
          </SectionTitle>

          <div style={{ marginBottom: spacing.lg }}>
            <Input
              type="text"
              placeholder="Search part name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: isDesktop ? '350px' : '100%' }}
            />
          </div>

          {/* Add Part Form */}
          {showAddPartForm && (
            <div style={formCard}>
              <h3 style={{ margin: `0 0 ${spacing.lg} 0`, fontSize: '1rem', fontWeight: '700', color: colors.darkText }}>Add New Part</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
                <Input type="text" placeholder="Part Code" value={partCode} onChange={(e) => setPartCode(e.target.value)} />
                <Input type="text" placeholder="Part Name" value={partName} onChange={(e) => setPartName(e.target.value)} />
                <Input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
                <Input type="number" placeholder="Current Stock" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} />
                <Input type="number" placeholder="Minimum Stock" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                <Input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                <Input type="text" placeholder="QR Code" value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
              </div>
              <Button variant="success" size="md" onClick={handleSavePart} style={{ marginTop: spacing.lg }}>Save Part</Button>
            </div>
          )}

          {/* Use Part Form */}
          {showUsePartForm && selectedPart && (
            <div style={formCard}>
              <h3 style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '1rem', fontWeight: '700', color: colors.darkText }}>Use Part</h3>
              <p style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '0.9rem', color: colors.darkText }}>
                <strong>{selectedPart.part_name}</strong> — Stock: {selectedPart.current_stock}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
                <select value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)} style={selectStyle}>
                  <option value="">Select Machine</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_code}</option>)}
                </select>
                <Input type="number" placeholder="Quantity to use" value={useQty} onChange={(e) => setUseQty(e.target.value)} />
                <Input type="text" placeholder="Note" value={useNote} onChange={(e) => setUseNote(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
                <Button variant="danger" size="md" onClick={handleSaveUsage}>Save Usage</Button>
                <Button variant="secondary" size="md" onClick={() => setShowUsePartForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Add Stock Form */}
          {showAddStockForm && addStockPart && (
            <div style={formCard}>
              <h3 style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '1rem', fontWeight: '700', color: colors.darkText }}>Add Stock</h3>
              <p style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '0.9rem', color: colors.darkText }}>
                <strong>{addStockPart.part_name}</strong> — Current Stock: {addStockPart.current_stock}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
                <Input type="number" placeholder="Quantity to add" value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                <Input type="text" placeholder="Note" value={addNote} onChange={(e) => setAddNote(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
                <Button variant="success" size="md" onClick={handleSaveAddStock}>Save</Button>
                <Button variant="secondary" size="md" onClick={() => setShowAddStockForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Parts Table (desktop) / Cards (mobile/tablet) */}
          {isDesktop ? (
            <div style={{ backgroundColor: colors.white, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: spacing.xxxl }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                    {['Part Code', 'Part Name', 'Category', 'Stock', 'Min Stock', 'Location', 'Action'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: spacing.md, fontSize: '0.85rem', fontWeight: '600', color: colors.darkText }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part) => (
                    <tr key={part.id} style={{
                      backgroundColor: part.current_stock <= part.min_stock ? '#FEF2F2' : colors.white,
                      borderBottom: `1px solid ${colors.border}`,
                    }}>
                      <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{part.part_code}</td>
                      <td style={{ padding: spacing.md, fontSize: '0.85rem' }}>
                        <button onClick={() => setPreviewPart(part)} style={{
                          padding: 0, border: 'none', background: 'transparent',
                          color: colors.primary, cursor: 'pointer', textDecoration: 'underline',
                          fontSize: 'inherit', fontFamily: 'inherit',
                        }}>{part.part_name}</button>
                      </td>
                      <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{part.category}</td>
                      <td style={{ padding: spacing.md, fontSize: '0.85rem' }}>
                        <strong style={{ color: part.current_stock <= part.min_stock ? colors.danger : colors.darkText }}>
                          {part.current_stock}
                        </strong>
                      </td>
                      <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{part.min_stock}</td>
                      <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{part.location}</td>
                      <td style={{ padding: spacing.md }}>
                        <div style={{ display: 'flex', gap: spacing.xs }}>
                          <Button variant="danger" size="sm" onClick={() => openUsePartForm(part)}>Use</Button>
                          <Button variant="success" size="sm" onClick={() => openAddStockForm(part)}>Add</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.xxxl }}>
              {filteredParts.map((part) => (
                <div key={part.id} style={{
                  backgroundColor: part.current_stock <= part.min_stock ? '#FEF2F2' : colors.white,
                  borderRadius: '12px',
                  padding: spacing.lg,
                  border: `1px solid ${part.current_stock <= part.min_stock ? '#FECACA' : colors.border}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <div>
                      <button onClick={() => setPreviewPart(part)} style={{
                        padding: 0, border: 'none', background: 'transparent',
                        color: colors.primary, cursor: 'pointer', textDecoration: 'underline',
                        fontSize: '1rem', fontWeight: '700', fontFamily: 'inherit',
                      }}>{part.part_name}</button>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: colors.lightText }}>{part.part_code}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: part.current_stock <= part.min_stock ? colors.danger : colors.darkText }}>
                        {part.current_stock}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: colors.lightText }}>/ min {part.min_stock}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md, flexWrap: 'wrap' }}>
                    {part.category && (
                      <span style={{ fontSize: '0.75rem', color: colors.mediumText, backgroundColor: colors.background, padding: '2px 8px', borderRadius: '999px' }}>
                        {part.category}
                      </span>
                    )}
                    {part.location && (
                      <span style={{ fontSize: '0.75rem', color: colors.mediumText }}>📍 {part.location}</span>
                    )}
                    {part.current_stock <= part.min_stock && (
                      <span style={{ fontSize: '0.75rem', color: colors.danger, fontWeight: '600' }}>⚠️ Low Stock</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button onClick={() => openUsePartForm(part)} style={{
                      flex: 1, height: '44px', backgroundColor: '#FEF2F2',
                      color: colors.danger, border: `1px solid #FECACA`,
                      borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                    }}>Use Part</button>
                    <button onClick={() => openAddStockForm(part)} style={{
                      flex: 1, height: '44px', backgroundColor: '#F0FDF4',
                      color: '#15803D', border: `1px solid #BBF7D0`,
                      borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                    }}>Add Stock</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STOCK TRANSACTIONS ── */}
          <SectionTitle isDesktop={isDesktop}>Recent Stock Transactions</SectionTitle>

          {isDesktop ? (
            <div style={{ backgroundColor: colors.white, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: spacing.xxxl }}>
              {transactions.length === 0 ? (
                <p style={{ padding: spacing.lg, color: colors.lightText, fontSize: '0.9rem' }}>No transactions found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                      {['Part Name', 'Machine', 'Type', 'Qty', 'Note', 'By'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: spacing.md, fontSize: '0.85rem', fontWeight: '600', color: colors.darkText }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{getPartName(t.part_id)}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{getMachineCode(t.machine_id)}</td>
                        <td style={{ padding: spacing.md }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                            fontSize: '0.75rem', fontWeight: '600',
                            backgroundColor: t.transaction_type === 'IN' ? '#D1FAE5' : '#FEE2E2',
                            color: t.transaction_type === 'IN' ? '#065F46' : '#991B1B',
                          }}>{t.transaction_type}</span>
                        </td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{t.qty}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{t.note}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{t.created_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.xxxl }}>
              {transactions.length === 0 ? (
                <p style={{ color: colors.lightText, fontSize: '0.9rem' }}>No transactions found.</p>
              ) : transactions.map((t) => (
                <div key={t.id} style={{
                  backgroundColor: colors.white, borderRadius: '10px',
                  padding: spacing.md, border: `1px solid ${colors.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: colors.darkText }}>{getPartName(t.part_id)}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: colors.lightText }}>{getMachineCode(t.machine_id)} · {t.note}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                      fontSize: '0.75rem', fontWeight: '600',
                      backgroundColor: t.transaction_type === 'IN' ? '#D1FAE5' : '#FEE2E2',
                      color: t.transaction_type === 'IN' ? '#065F46' : '#991B1B',
                    }}>{t.transaction_type} {t.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MAINTENANCE HISTORY ── */}
          <SectionTitle isDesktop={isDesktop} action={
            <Button variant="primary" size="md" onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}>
              {showMaintenanceForm ? 'Cancel' : '+ Add Log'}
            </Button>
          }>
            Maintenance History
          </SectionTitle>

          {showMaintenanceForm && (
            <div style={formCard}>
              <h3 style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '1rem', fontWeight: '700', color: colors.darkText }}>Add Maintenance Log</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
                <select value={maintenanceMachineId} onChange={(e) => setMaintenanceMachineId(e.target.value)} style={selectStyle}>
                  <option value="">Select Machine</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_code}</option>)}
                </select>
                <Input type="text" placeholder="Issue Title" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
                <Input type="text" placeholder="Symptom" value={symptom} onChange={(e) => setSymptom(e.target.value)} />
                <Input type="text" placeholder="Action Taken" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
                <Input type="text" placeholder="Result" value={result} onChange={(e) => setResult(e.target.value)} />
              </div>
              <Button variant="primary" size="md" onClick={handleSaveMaintenance} style={{ marginTop: spacing.lg }}>Save Maintenance Log</Button>
            </div>
          )}

          {isDesktop ? (
            <div style={{ backgroundColor: colors.white, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: spacing.xxxl }}>
              {maintenanceLogs.length === 0 ? (
                <p style={{ padding: spacing.lg, color: colors.lightText, fontSize: '0.9rem' }}>No maintenance logs found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                      {['Machine', 'Issue', 'Symptom', 'Action', 'Result', 'By'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: spacing.md, fontSize: '0.85rem', fontWeight: '600', color: colors.darkText }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{getMachineCode(log.machine_id)}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{log.issue_title}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{log.symptom}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{log.action_taken}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{log.result}</td>
                        <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{log.created_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.xxxl }}>
              {maintenanceLogs.length === 0 ? (
                <p style={{ color: colors.lightText, fontSize: '0.9rem' }}>No maintenance logs found.</p>
              ) : maintenanceLogs.map((log) => (
                <div key={log.id} style={{
                  backgroundColor: colors.white, borderRadius: '10px',
                  padding: spacing.lg, border: `1px solid ${colors.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: colors.darkText }}>{getMachineCode(log.machine_id)}</span>
                    <span style={{ fontSize: '0.75rem', color: colors.lightText }}>{log.created_by}</span>
                  </div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: colors.darkText, fontWeight: '600' }}>{log.issue_title}</p>
                  {log.symptom && <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: colors.mediumText }}>Symptom: {log.symptom}</p>}
                  {log.action_taken && <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: colors.mediumText }}>Action: {log.action_taken}</p>}
                  {log.result && <p style={{ margin: 0, fontSize: '0.8rem', color: colors.mediumText }}>Result: {log.result}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Part Preview Modal */}
          {previewPart && previewPartData && (
            <div onClick={() => setPreviewPart(null)} style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: spacing.lg,
            }}>
              <div onClick={(e) => e.stopPropagation()} style={{
                width: 'min(560px, 100%)', backgroundColor: colors.white,
                borderRadius: borderRadius.lg, boxShadow: shadows.lg, padding: spacing.xl,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.darkText }}>{previewPart.part_name}</h3>
                  <Button variant="secondary" size="sm" onClick={() => setPreviewPart(null)}>Close</Button>
                </div>
                {previewPartData.imageUrl ? (
                  <img src={previewPartData.imageUrl} alt={previewPart.part_name} style={{
                    width: '100%', maxHeight: '260px', objectFit: 'cover',
                    borderRadius: borderRadius.md, marginBottom: spacing.md,
                  }} />
                ) : (
                  <div style={{
                    width: '100%', height: '160px', borderRadius: borderRadius.md,
                    border: `1px dashed ${colors.border}`, backgroundColor: colors.background,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.lightText, marginBottom: spacing.md,
                  }}>No image available</div>
                )}
                <p style={{ margin: `0 0 ${spacing.sm} 0`, fontSize: '0.9rem', color: colors.darkText }}>
                  <strong>Description:</strong> {previewPartData.description}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: colors.mediumText }}>
                  <strong>Measurement:</strong> {previewPartData.measurement}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

export default FactoryDetailPage;