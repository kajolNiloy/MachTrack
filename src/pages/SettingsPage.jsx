import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";
import { colors, spacing, borderRadius } from "../constants/designTokens";
import Button from "../components/Button";
import Input from "../components/Input";

function PasswordInput({ placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingRight: '44px' }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: 'absolute', right: '12px', top: '50%',
          transform: 'translateY(-50%)', background: 'none',
          border: 'none', cursor: 'pointer', fontSize: '1.1rem',
          color: colors.lightText, padding: '0', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

function SettingsPage() {
  const { username, role } = useAuth();
  const device = useDeviceType();
  const isDesktop = device === "desktop";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleChangePassword() {
    setSuccessMsg("");
    setErrorMsg("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Please fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }

    setIsSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyError) {
      setErrorMsg("Current password is incorrect");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSaving(false);

    if (updateError) {
      setErrorMsg(`Failed to update password: ${updateError.message}`);
      return;
    }

    setSuccessMsg("Password changed successfully! ✅");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const roleColors = {
    admin: { bg: '#EFF6FF', color: '#1a56db' },
    maintenance: { bg: '#FFF7ED', color: '#c2410c' },
    operator: { bg: '#F0FDF4', color: '#15803d' },
    viewer: { bg: '#F5F3FF', color: '#7c3aed' },
  };

  return (
    <AppLayout>
      {/* Header */}
      <div style={{
        marginBottom: spacing.xl, paddingBottom: spacing.md,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <h2 style={{ margin: 0, fontSize: isDesktop ? '1.5rem' : '1.2rem', fontWeight: '700', color: colors.darkText }}>
          ⚙️ Settings
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: colors.lightText }}>
          Manage your account settings
        </p>
      </div>

      {/* Profile card */}
      <div style={{
        backgroundColor: colors.white, borderRadius: '12px', padding: spacing.xl,
        border: `1px solid ${colors.border}`, marginBottom: spacing.xl,
        display: 'flex', alignItems: 'center', gap: spacing.lg,
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
        }}>
          👤
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.darkText }}>
            {username || 'User'}
          </h3>
          <span style={{
            display: 'inline-block', marginTop: '4px', padding: '2px 10px',
            borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600',
            backgroundColor: roleColors[role]?.bg || colors.background,
            color: roleColors[role]?.color || colors.darkText,
          }}>
            {role}
          </span>
        </div>
      </div>

      {/* Change Password */}
      <div style={{
        backgroundColor: colors.white, borderRadius: '12px', padding: spacing.xl,
        border: `1px solid ${colors.border}`, maxWidth: isDesktop ? '500px' : '100%',
      }}>
        <h3 style={{ margin: `0 0 ${spacing.lg} 0`, fontSize: '1rem', fontWeight: '700', color: colors.darkText }}>
          🔒 Change Password
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: colors.lightText, display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Current Password
            </label>
            <PasswordInput
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: colors.lightText, display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              New Password
            </label>
            <PasswordInput
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: colors.lightText, display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Confirm New Password
            </label>
            <PasswordInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && (
          <div style={{
            marginTop: spacing.md, padding: spacing.md,
            backgroundColor: '#FEF2F2', border: `1px solid ${colors.danger}`,
            borderRadius: borderRadius.md, color: colors.danger, fontSize: '0.85rem',
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            marginTop: spacing.md, padding: spacing.md,
            backgroundColor: '#F0FDF4', border: `1px solid #15803d`,
            borderRadius: borderRadius.md, color: '#15803d', fontSize: '0.85rem',
          }}>
            {successMsg}
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          onClick={handleChangePassword}
          style={{ marginTop: spacing.lg, width: '100%' }}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Change Password'}
        </Button>
      </div>
    </AppLayout>
  );
}

export default SettingsPage;