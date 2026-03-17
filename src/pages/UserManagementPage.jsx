import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";
import { colors, spacing, borderRadius } from "../constants/designTokens";

const ROLES = ["admin", "maintenance", "operator", "viewer"];

const ROLE_COLORS = {
  admin:       { bg: "#ede9fe", color: "#5b21b6" },
  maintenance: { bg: "#e0f2fe", color: "#0369a1" },
  operator:    { bg: "#dcfce7", color: "#15803d" },
  viewer:      { bg: "#f3f4f6", color: "#374151" },
};

const ROLE_DESCRIPTIONS = {
  admin:       "Full access including user management",
  maintenance: "Can add/edit maintenance logs and use parts",
  operator:    "Can view machines and record part usage",
  viewer:      "Read-only access to factories and inventory",
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase",
      letterSpacing: "0.05em", backgroundColor: c.bg, color: c.color,
    }}>
      {role}
    </span>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const clrs = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  return (
    <div style={{ marginTop: "6px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: "4px", borderRadius: "2px",
            backgroundColor: i < strength ? clrs[strength - 1] : "#e5e7eb",
            transition: "background-color 200ms",
          }} />
        ))}
      </div>
      <span style={{ fontSize: "0.72rem", color: strength > 0 ? clrs[strength - 1] : "#9ca3af" }}>
        {strength > 0 ? labels[strength - 1] : ""}
      </span>
    </div>
  );
}

function UserManagementPage() {
  const { role: currentUserRole, createUser, adminResetPassword } = useAuth();
  const device = useDeviceType();
  const isDesktop = device === "desktop";
  const isMobile = device === "mobile";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Create form
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Reset password
  const [resetUserId, setResetUserId] = useState(null);
  const [resetUsername, setResetUsername] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Edit role
  const [editRoleUserId, setEditRoleUserId] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, role, created_at")
      .order("created_at", { ascending: false });
    if (!error) setUsers(data || []);
    setLoading(false);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateError(""); setCreateSuccess("");

    if (!newUsername.trim()) { setCreateError("Username is required."); return; }
    if (/\s/.test(newUsername)) { setCreateError("Username cannot contain spaces."); return; }
    if (newPassword.length < 6) { setCreateError("Password must be at least 6 characters."); return; }

    // Check username already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", newUsername.toLowerCase().trim())
      .maybeSingle();
    if (existing) { setCreateError("Username already exists. Choose a different one."); return; }

    setIsCreating(true);
    const { data, error } = await createUser({
      usernameInput: newUsername,
      password: newPassword,
      role: newRole,
      displayName: newFullName || newUsername,
    });
    setIsCreating(false);

    if (error) {
      if (error.message?.includes("already registered")) {
        setCreateError("Username already exists.");
      } else {
        setCreateError(error.message || "Failed to create user.");
      }
      return;
    }

    setCreateSuccess(`User "${newUsername}" created successfully!`);
    setNewUsername(""); setNewFullName(""); setNewPassword(""); setNewRole("viewer");
    setShowCreateForm(false);
    fetchUsers();
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetError(""); setResetSuccess("");
    if (resetPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }

    setIsResetting(true);
    const { error } = await adminResetPassword(resetUserId, resetPassword);
    setIsResetting(false);

    if (error) {
      setResetError(error.message || "Failed to reset password.");
      return;
    }

    setResetSuccess(`Password for "${resetUsername}" has been reset successfully!`);
    setResetPassword("");
    setTimeout(() => {
      setResetUserId(null); setResetUsername(""); setResetSuccess("");
    }, 2500);
  }

  async function handleSaveRole(userId) {
    setIsSavingRole(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: editRoleValue })
      .eq("id", userId);
    setIsSavingRole(false);
    if (!error) { setEditRoleUserId(null); fetchUsers(); }
  }

  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    fontSize: "0.875rem",
    backgroundColor: colors.white,
    color: colors.darkText,
    outline: "none",
  };

  const selectStyle = {
    ...inputStyle, height: "42px", cursor: "pointer",
  };

  const formCard = {
    backgroundColor: colors.white, borderRadius: "12px", padding: spacing.xl,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: spacing.xl,
  };

  return (
    <AppLayout>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "1.5rem" }}>👥</span>
          <h2 style={{
            margin: 0, fontSize: isMobile ? "1.3rem" : "1.6rem",
            fontWeight: 700, color: colors.darkText, letterSpacing: "-0.02em",
          }}>
            User Management
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: colors.lightText }}>
          Create accounts and manage roles for your team
        </p>
      </div>

      {/* Summary cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)",
        gap: spacing.md, marginBottom: spacing.xl, justifyContent: "start",
      }}>
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r).length;
          const c = ROLE_COLORS[r];
          return (
            <div key={r} style={{
              backgroundColor: c.bg, borderRadius: "10px",
              padding: `${spacing.md} ${spacing.lg}`, minWidth: "100px",
            }}>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: c.color }}>{count}</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: colors.lightText, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                {r}
              </p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.lg, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(""); setCreateSuccess(""); }}
          style={{
            padding: "10px 20px", borderRadius: "8px", fontSize: "0.9rem",
            fontWeight: 700, cursor: "pointer", border: "none",
            backgroundColor: showCreateForm ? colors.border : colors.primary,
            color: showCreateForm ? colors.darkText : colors.white,
            transition: "150ms",
          }}
        >
          {showCreateForm ? "✕ Cancel" : "+ Create User"}
        </button>

        <div style={{ position: "relative", flex: isDesktop ? "0 0 300px" : "1 1 100%" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: colors.lightText, pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by username or role…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px" }}
          />
        </div>
      </div>

      {/* Success message */}
      {createSuccess && (
        <div style={{
          padding: spacing.md, borderRadius: "8px", marginBottom: spacing.lg,
          backgroundColor: "#d1fae5", border: "1px solid #6ee7b7",
          color: "#065f46", fontSize: "0.875rem", fontWeight: 600,
        }}>
          ✅ {createSuccess}
        </div>
      )}

      {/* Create user form */}
      {showCreateForm && (
        <div style={formCard}>
          <h3 style={{ margin: `0 0 ${spacing.lg} 0`, fontSize: "1rem", fontWeight: 700, color: colors.darkText }}>
            Create New User
          </h3>
          <form onSubmit={handleCreateUser}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: spacing.md, marginBottom: spacing.lg,
            }}>
              {/* Username */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.8rem", fontWeight: 600, color: colors.mediumText }}>
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="e.g. john_doe"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                  style={inputStyle}
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <p style={{ margin: "4px 0 0 0", fontSize: "0.72rem", color: colors.lightText }}>
                  Lowercase, no spaces. This is what they type to log in.
                </p>
              </div>

              {/* Full name */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.8rem", fontWeight: 600, color: colors.mediumText }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Temporary password */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.8rem", fontWeight: 600, color: colors.mediumText }}>
                  Temporary Password *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welcome123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  autoComplete="off"
                />
                <PasswordStrength password={newPassword} />
                <p style={{ margin: "4px 0 0 0", fontSize: "0.72rem", color: colors.lightText }}>
                  Share this with the user in person.
                </p>
              </div>

              {/* Role */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.8rem", fontWeight: 600, color: colors.mediumText }}>
                  Role *
                </label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={selectStyle}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.72rem", color: colors.lightText }}>
                  {ROLE_DESCRIPTIONS[newRole]}
                </p>
              </div>
            </div>

            {createError && (
              <div style={{
                padding: spacing.md, borderRadius: "8px", marginBottom: spacing.md,
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                color: "#991b1b", fontSize: "0.875rem",
              }}>
                ⚠️ {createError}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              style={{
                padding: "10px 24px", borderRadius: "8px", fontSize: "0.9rem",
                fontWeight: 700, cursor: isCreating ? "not-allowed" : "pointer",
                border: "none",
                backgroundColor: isCreating ? colors.border : "#16a34a",
                color: isCreating ? colors.mediumText : colors.white,
                opacity: isCreating ? 0.7 : 1,
              }}
            >
              {isCreating ? "Creating…" : "✓ Create User"}
            </button>
          </form>
        </div>
      )}

      {/* Reset password form */}
      {resetUserId && (
        <div style={{ ...formCard, borderColor: "#f59e0b", backgroundColor: "#fffbeb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: colors.darkText }}>
              🔑 Reset Password — <span style={{ color: "#b45309" }}>{resetUsername}</span>
            </h3>
            <button
              onClick={() => { setResetUserId(null); setResetPassword(""); setResetError(""); setResetSuccess(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: colors.lightText }}
            >✕</button>
          </div>
          <form onSubmit={handleResetPassword}>
            <div style={{ maxWidth: "320px", marginBottom: spacing.md }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.8rem", fontWeight: 600, color: colors.mediumText }}>
                New Password
              </label>
              <input
                type="text"
                placeholder="Enter new password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                style={inputStyle}
                autoComplete="off"
              />
              <PasswordStrength password={resetPassword} />
              <p style={{ margin: "4px 0 0 0", fontSize: "0.72rem", color: colors.lightText }}>
                Share the new password with the user in person.
              </p>
            </div>

            {resetError && (
              <div style={{ padding: spacing.md, borderRadius: "8px", marginBottom: spacing.md, backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.875rem" }}>
                ⚠️ {resetError}
              </div>
            )}
            {resetSuccess && (
              <div style={{ padding: spacing.md, borderRadius: "8px", marginBottom: spacing.md, backgroundColor: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46", fontSize: "0.875rem" }}>
                ✅ {resetSuccess}
              </div>
            )}

            <div style={{ display: "flex", gap: spacing.md }}>
              <button
                type="submit"
                disabled={isResetting}
                style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: colors.primary, color: colors.white, opacity: isResetting ? 0.7 : 1 }}
              >
                {isResetting ? "Resetting…" : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={() => { setResetUserId(null); setResetPassword(""); setResetError(""); }}
                style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", border: `1px solid ${colors.border}`, backgroundColor: colors.white, color: colors.darkText }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users count */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: colors.lightText, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Users list */}
      {loading ? (
        <p style={{ color: colors.lightText }}>Loading users…</p>
      ) : isDesktop ? (
        <div style={{ backgroundColor: colors.white, borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                {["User", "Full Name", "Role", "Created", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: spacing.md, fontSize: "0.82rem", fontWeight: 600, color: colors.darkText }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.white }}>
                  <td style={{ padding: spacing.md }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        backgroundColor: ROLE_COLORS[u.role]?.bg || "#f3f4f6",
                        color: ROLE_COLORS[u.role]?.color || colors.mediumText,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
                      }}>
                        {(u.username || "?")[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.darkText, fontFamily: "monospace" }}>
                        {u.username || "—"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: spacing.md, fontSize: "0.875rem", color: colors.darkText }}>
                    {u.full_name || "—"}
                  </td>
                  <td style={{ padding: spacing.md }}>
                    {editRoleUserId === u.id ? (
                      <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                        <select
                          value={editRoleValue}
                          onChange={(e) => setEditRoleValue(e.target.value)}
                          style={{ ...selectStyle, width: "auto", height: "32px", padding: "4px 8px", fontSize: "0.8rem" }}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button onClick={() => handleSaveRole(u.id)} disabled={isSavingRole}
                          style={{ padding: "4px 10px", borderRadius: "6px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                          {isSavingRole ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditRoleUserId(null)}
                          style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${colors.border}`, backgroundColor: colors.white, color: colors.darkText, fontSize: "0.78rem", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td style={{ padding: spacing.md, fontSize: "0.8rem", color: colors.lightText }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: spacing.md }}>
                    <div style={{ display: "flex", gap: spacing.xs }}>
                      <button
                        onClick={() => { setEditRoleUserId(u.id); setEditRoleValue(u.role); setResetUserId(null); }}
                        style={{ padding: "4px 10px", fontSize: "0.78rem", fontWeight: 600, backgroundColor: "#eff6ff", color: colors.primary, border: `1px solid #bfdbfe`, borderRadius: "6px", cursor: "pointer" }}>
                        Edit Role
                      </button>
                      <button
                        onClick={() => { setResetUserId(u.id); setResetUsername(u.username); setResetPassword(""); setResetError(""); setResetSuccess(""); setEditRoleUserId(null); }}
                        style={{ padding: "4px 10px", fontSize: "0.78rem", fontWeight: 600, backgroundColor: "#fffbeb", color: "#b45309", border: `1px solid #f59e0b`, borderRadius: "6px", cursor: "pointer" }}>
                        Reset PW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Mobile cards
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {filteredUsers.map((u) => (
            <div key={u.id} style={{
              backgroundColor: colors.white, borderRadius: "12px", padding: spacing.lg,
              border: `1px solid ${colors.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: ROLE_COLORS[u.role]?.bg || "#f3f4f6",
                    color: ROLE_COLORS[u.role]?.color || colors.mediumText,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 700,
                  }}>
                    {(u.username || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: colors.darkText, fontFamily: "monospace" }}>
                      {u.username || "—"}
                    </p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: colors.lightText }}>
                      {u.full_name || "No display name"}
                    </p>
                  </div>
                </div>
                <RoleBadge role={u.role} />
              </div>

              {editRoleUserId === u.id && (
                <div style={{ margin: `${spacing.sm} 0`, padding: spacing.md, backgroundColor: colors.background, borderRadius: "8px" }}>
                  <select value={editRoleValue} onChange={(e) => setEditRoleValue(e.target.value)} style={{ ...selectStyle, marginBottom: spacing.sm }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: spacing.sm }}>
                    <button onClick={() => handleSaveRole(u.id)} style={{ flex: 1, height: "36px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditRoleUserId(null)} style={{ flex: 1, height: "36px", backgroundColor: colors.white, color: colors.darkText, border: `1px solid ${colors.border}`, borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
                <button
                  onClick={() => { setEditRoleUserId(u.id); setEditRoleValue(u.role); setResetUserId(null); }}
                  style={{ flex: 1, height: "40px", backgroundColor: "#eff6ff", color: colors.primary, border: `1px solid #bfdbfe`, borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Edit Role
                </button>
                <button
                  onClick={() => { setResetUserId(u.id); setResetUsername(u.username); setResetPassword(""); setResetError(""); setResetSuccess(""); setEditRoleUserId(null); }}
                  style={{ flex: 1, height: "40px", backgroundColor: "#fffbeb", color: "#b45309", border: `1px solid #f59e0b`, borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default UserManagementPage;