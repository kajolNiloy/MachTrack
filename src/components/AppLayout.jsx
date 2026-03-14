import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import { colors, spacing } from '../constants/designTokens';

function AppLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
      <aside style={{ width: '240px', backgroundColor: colors.white, borderRight: `1px solid ${colors.border}`, padding: `${spacing.xl} 0`, overflowY: 'auto' }}>
        <h2 style={{ margin: `0 ${spacing.lg} ${spacing.xl} ${spacing.lg}`, fontSize: '1.25rem', fontWeight: '600', color: colors.darkText }}>MachTrack</h2>
        <nav>
          <Link to="/" style={{ display: 'block', padding: `${spacing.md} ${spacing.lg}`, color: colors.mediumText, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', borderLeft: `3px solid transparent`, transition: '150ms ease-in-out' }}>Factories</Link>
          <Link to="/scan" style={{ display: 'block', padding: `${spacing.md} ${spacing.lg}`, color: colors.mediumText, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', borderLeft: `3px solid transparent`, transition: '150ms ease-in-out' }}>Scan</Link>
          <Link to="/troubleshoot" style={{ display: 'block', padding: `${spacing.md} ${spacing.lg}`, color: colors.mediumText, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', borderLeft: `3px solid transparent`, transition: '150ms ease-in-out' }}>Troubleshoot</Link>
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '60px', backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`, padding: `0 ${spacing.xl}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: colors.darkText }}>MachTrack</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            {user && <span style={{ fontSize: '0.875rem', color: colors.lightText }}>{user.email}</span>}
            {user && <Button variant="danger" size="sm" onClick={logout}>Logout</Button>}
          </div>
        </header>
        <main style={{ flex: 1, padding: spacing.xl }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;