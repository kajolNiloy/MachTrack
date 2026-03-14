import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";
import { colors, spacing, borderRadius } from "../constants/designTokens";

function ConsumablesPage() {
  const device = useDeviceType();
  const isDesktop = device === 'desktop';
  const isMobile = device === 'mobile';

  const [consumables, setConsumables] = useState([]);
  const [factories, setFactories] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFactory, setFilterFactory] = useState("all");
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [c, f, m] = await Promise.all([
      supabase.from("consumables").select("*").order("factory_id").order("name"),
      supabase.from("factories").select("id, name, code").order("name"),
      supabase.from("machines").select("id, factory_id, machine_name, machine_code"),
    ]);
    if (!c.error) setConsumables(c.data || []);
    if (!f.error) setFactories(f.data || []);
    if (!m.error) setMachines(m.data || []);
    setLoading(false);
  }

  function getFactoryName(factoryId) {
    return factories.find((f) => f.id === factoryId)?.name || "—";
  }
  function getMachineName(machineId) {
    const m = machines.find((m) => m.id === machineId);
    return m ? m.machine_name : "—";
  }

  const filtered = consumables.filter((c) => {
    const matchSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFactory = filterFactory === "all" || String(c.factory_id) === filterFactory;
    const matchLow = !filterLowStock || c.current_stock <= c.min_stock;
    return matchSearch && matchFactory && matchLow;
  });

  const lowStockCount = consumables.filter((c) => c.current_stock <= c.min_stock).length;

  const selectStyle = {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    height: '42px',
    backgroundColor: colors.white,
    color: colors.darkText,
    cursor: 'pointer',
  };

  return (
    <AppLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .cs-search {
          width: 100%; box-sizing: border-box;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          border: 2px solid ${colors.border}; border-radius: 10px;
          padding: 10px 16px 10px 40px; outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          background: ${colors.white}; color: ${colors.darkText};
        }
        .cs-search:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 3px rgba(26,86,219,0.1); }
        .cs-search::placeholder { color: ${colors.lighter || '#9ca3af'}; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.5rem' }}>🧵</span>
          <h2 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 700, color: colors.darkText, letterSpacing: '-0.02em' }}>
            Consumables
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: colors.lightText }}>
          All consumables across every factory
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, auto)', gap: spacing.md, marginBottom: spacing.xl, justifyContent: 'start' }}>
        {[
          { label: 'Total Items', value: consumables.length, color: colors.primary, bg: '#EFF6FF' },
          { label: 'Low Stock', value: lowStockCount, color: colors.danger, bg: '#FEF2F2' },
          { label: 'Factories', value: factories.length, color: '#10b981', bg: '#ecfdf5' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '10px', padding: `${spacing.md} ${spacing.lg}`, minWidth: '120px' }}>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText, marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: isDesktop ? '0 0 320px' : '1 1 100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: colors.lightText, pointerEvents: 'none' }}>🔍</span>
          <input className="cs-search" type="text" placeholder="Search by name or category…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Factory filter */}
        <select value={filterFactory} onChange={(e) => setFilterFactory(e.target.value)} style={{ ...selectStyle, minWidth: '160px' }}>
          <option value="all">All Factories</option>
          {factories.map((f) => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
        </select>

        {/* Low stock toggle */}
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          style={{
            padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            backgroundColor: filterLowStock ? '#FEF2F2' : colors.white,
            color: filterLowStock ? colors.danger : colors.mediumText,
            border: `2px solid ${filterLowStock ? colors.danger : colors.border}`,
            transition: '150ms',
          }}
        >
          ⚠️ Low Stock {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
      </div>

      {/* Results label */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: colors.lightText, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table (desktop) / Cards (mobile/tablet) */}
      {loading ? (
        <p style={{ color: colors.lightText }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🧵</div>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.darkText, margin: '0 0 6px' }}>No consumables found</p>
          <p style={{ fontSize: '0.875rem', color: colors.lightText, margin: 0 }}>Try adjusting your filters or add consumables from a factory page.</p>
        </div>
      ) : isDesktop ? (
        <div style={{ backgroundColor: colors.white, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                {['Name', 'Category', 'Factory', 'Machine', 'Stock', 'Min', 'Unit', 'Location'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: spacing.md, fontSize: '0.82rem', fontWeight: '600', color: colors.darkText }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{
                  backgroundColor: c.current_stock <= c.min_stock ? '#FEF2F2' : colors.white,
                  borderBottom: `1px solid ${colors.border}`,
                }}>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', fontWeight: 600, color: colors.darkText }}>{c.name}</td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>
                    {c.category ? (
                      <span style={{ backgroundColor: colors.background, padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem' }}>{c.category}</span>
                    ) : <span style={{ color: colors.lightText, fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{getFactoryName(c.factory_id)}</td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{getMachineName(c.machine_id)}</td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem' }}>
                    <strong style={{ color: c.current_stock <= c.min_stock ? colors.danger : colors.darkText }}>
                      {c.current_stock}
                    </strong>
                    {c.current_stock <= c.min_stock && (
                      <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: colors.danger }}>⚠️ Low</span>
                    )}
                  </td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{c.min_stock}</td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>{c.unit}</td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>
                    {c.location || <span style={{ color: colors.lightText, fontStyle: 'italic' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {filtered.map((c) => (
            <div key={c.id} style={{
              backgroundColor: c.current_stock <= c.min_stock ? '#FEF2F2' : colors.white,
              borderRadius: '12px', padding: spacing.lg,
              border: `1px solid ${c.current_stock <= c.min_stock ? '#FECACA' : colors.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: colors.darkText }}>{c.name}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: colors.lightText }}>
                    🏭 {getFactoryName(c.factory_id)} · 🔧 {getMachineName(c.machine_id)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: c.current_stock <= c.min_stock ? colors.danger : colors.darkText }}>{c.current_stock}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: colors.lightText }}>{c.unit} / min {c.min_stock}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                {c.category && <span style={{ fontSize: '0.75rem', color: colors.mediumText, backgroundColor: colors.background, padding: '2px 8px', borderRadius: '999px' }}>{c.category}</span>}
                {c.location && <span style={{ fontSize: '0.75rem', color: colors.mediumText }}>📍 {c.location}</span>}
                {c.current_stock <= c.min_stock && <span style={{ fontSize: '0.75rem', color: colors.danger, fontWeight: 600 }}>⚠️ Low Stock</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default ConsumablesPage;