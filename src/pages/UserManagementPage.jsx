import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";
import { colors, spacing, borderRadius } from "../constants/designTokens";
import Button from "../components/Button";
import Input from "../components/Input";

const ROLES = ["admin", "maintenance", "operator", "viewer"];

function UserManagementPage() {
  const { t } = useTranslation();
  const device = useDeviceType();
  const isDesktop = device === "desktop";
  const isMobile = device === "mobile";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("operator");
  const [newFullName, setNewFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, role")
      .order("username", { ascending: true });
    if (!error) setUsers(data || []);
    setLoading(false);
  }

  async function handleCreateUser() {
    if (!newUsername || !newPassword) {
      alert("Please enter username and password");
      return;
    }
    setIsSaving(true);

    const { data, error } = await supabase.rpc('create_user_with_profile', {
      p_username: newUsername.toLowerCase().trim(),
      p_password: newPassword,
      p_full_name: newFullName,
      p_role: newRole,
    });

    if (error) {
      alert(`Failed to create user: ${error.message}`);
      setIsSaving(false);
      return;
    }

    if (!data.success) {
      alert(`Failed to create user: ${data.error}`);
      setIsSaving(false);
      return;
    }

    alert(`User "${newUsername}" created successfully!`);
    setNewUsername(""); setNewPassword(""); setNewRole("operator"); setNewFullName("");
    setShowAddForm(false);
    fetchUsers();
    setIsSaving(false);
  }

  async function handleUpdateRole(userId, newRole) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      alert("Failed to update role");
      return;
    }
    setEditingUserId(null);
    fetchUsers();
  }

  const roleColors = {
    admin: { bg: '#EFF6FF', color: '#1a56db' },
    maintenance: { bg: '#FFF7ED', color: '#c2410c' },
    operator: { bg: '#F0FDF4', color: '#15803d' },
    viewer: { bg: '#F5F3FF', color: '#7c3aed' },
  };

  const selectStyle = {
    padding: spacing.md, borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`, fontSize: '0.875rem',
    width: '100%', height: '42px',
    backgroundColor: colors.white, color: colors.darkText,
  };

  return (
    <AppLayout>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: spacing.xl, paddingBottom: spacing.md,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isDesktop ? '1.5rem' : '1.2rem', fontWeight: '700', color: colors.darkText }}>
            👥 User Management
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: colors.lightText }}>
            {users.length} users total
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add User'}
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: '#fafcff', borderRadius: '12px', padding: spacing.xl,
          border: `2px solid ${colors.primary}`, marginBottom: spacing.lg,
        }}>
          <h3 style={{ margin: `0 0 ${spacing.lg} 0`, fontSize: '1rem', fontWeight: '700', color: colors.darkText }}>
            Create New User
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
            <Input
              type="text"
              placeholder="Username (e.g. tanaka)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            />
            <Input
              type="text"
              placeholder="Full Name (e.g. Tanaka San)"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={selectStyle}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Role descriptions */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: spacing.sm, marginTop: spacing.lg }}>
            {[
              { role: 'admin', desc: 'Full access, manage users' },
              { role: 'maintenance', desc: 'Add logs, use parts' },
              { role: 'operator', desc: 'Use parts, scan QR' },
              { role: 'viewer', desc: 'View only, no edits' },
            ].map((r) => (
              <div
                key={r.role}
                onClick={() => setNewRole(r.role)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: newRole === r.role ? roleColors[r.role].bg : colors.background,
                  border: `1px solid ${newRole === r.role ? roleColors[r.role].color : colors.border}`,
                  transition: '150ms ease-in-out',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: roleColors[r.role].color }}>
                  {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: colors.lightText }}>{r.desc}</p>
              </div>
            ))}
          </div>

          <Button variant="success" size="md" onClick={handleCreateUser} style={{ marginTop: spacing.lg }} disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <p style={{ color: colors.lightText }}>Loading users...</p>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.lightText }}>
          No users found.
        </div>
      ) : isDesktop ? (
        <div style={{ backgroundColor: colors.white, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, borderBottom: `2px solid ${colors.border}` }}>
                {['Username', 'Full Name', 'Role', 'Action'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: spacing.md, fontSize: '0.85rem', fontWeight: '600', color: colors.darkText }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', fontWeight: '600', color: colors.darkText }}>
                    {user.username || '—'}
                  </td>
                  <td style={{ padding: spacing.md, fontSize: '0.85rem', color: colors.darkText }}>
                    {user.full_name || '—'}
                  </td>
                  <td style={{ padding: spacing.md }}>
                    {editingUserId === user.id ? (
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        style={{ ...selectStyle, width: 'auto', height: '36px' }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-block', padding: '3px 12px', borderRadius: '999px',
                        fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: roleColors[user.role]?.bg || colors.background,
                        color: roleColors[user.role]?.color || colors.darkText,
                      }}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: spacing.md }}>
                    {editingUserId === user.id ? (
                      <div style={{ display: 'flex', gap: spacing.xs }}>
                        <Button variant="primary" size="sm" onClick={() => handleUpdateRole(user.id, editingRole)}>
                          Save
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingUserId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingUserId(user.id); setEditingRole(user.role); }}
                        style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: '600', backgroundColor: '#EFF6FF', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Change Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {users.map((user) => (
            <div key={user.id} style={{
              backgroundColor: colors.white, borderRadius: '12px', padding: spacing.lg,
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: colors.darkText }}>{user.username || '—'}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: colors.lightText }}>{user.full_name || '—'}</p>
                </div>
                <span style={{
                  display: 'inline-block', padding: '3px 12px', borderRadius: '999px',
                  fontSize: '0.75rem', fontWeight: '600',
                  backgroundColor: roleColors[user.role]?.bg || colors.background,
                  color: roleColors[user.role]?.color || colors.darkText,
                }}>
                  {user.role}
                </span>
              </div>
              {editingUserId === user.id ? (
                <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    style={{ ...selectStyle, flex: 1 }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  <Button variant="primary" size="sm" onClick={() => handleUpdateRole(user.id, editingRole)}>Save</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditingUserId(null)}>Cancel</Button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingUserId(user.id); setEditingRole(user.role); }}
                  style={{ width: '100%', height: '40px', backgroundColor: '#EFF6FF', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', marginTop: spacing.sm }}
                >
                  Change Role
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default UserManagementPage;