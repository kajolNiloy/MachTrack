import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { colors, spacing } from '../constants/designTokens';

const navLinks = [
  { to: '/', labelKey: 'factories', icon: '🏭' },
  { to: '/scan', labelKey: 'scan', icon: '📷' },
  { to: '/troubleshoot', labelKey: 'troubleshoot', icon: '🔧' },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      style={{
        fontSize: '0.85rem', padding: '6px 10px', borderRadius: '6px',
        border: `1px solid ${colors.border}`, cursor: 'pointer',
        backgroundColor: colors.white, color: colors.darkText, fontWeight: '500',
      }}
    >
      <option value="en">English</option>
      <option value="ja">日本語</option>
      <option value="fil">Filipino</option>
      <option value="bn">বাংলা</option>
    </select>
  );
}

function AppLayout({ children }) {
  const { user, role, username, logout } = useAuth();
  const location = useLocation();
  const device = useDeviceType();
  const { t } = useTranslation();
  const isDesktop = device === 'desktop';

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const displayName = username || user?.email;

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>

        {/* Sidebar */}
        <aside style={{
          width: '260px', backgroundColor: colors.white,
          borderRight: `1px solid ${colors.border}`, display: 'flex',
          flexDirection: 'column', position: 'fixed', top: 0, left: 0,
          height: '100vh', zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ padding: `${spacing.xl} ${spacing.lg}`, borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <div style={{
                width: '36px', height: '36px', backgroundColor: colors.primary,
                borderRadius: '8px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.1rem',
              }}>🏭</div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: colors.darkText }}>
                MachTrack
              </h2>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: `${spacing.lg} 0` }}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing.md,
                  padding: `${spacing.md} ${spacing.lg}`, margin: `2px ${spacing.sm}`,
                  borderRadius: '8px', textDecoration: 'none',
                  color: isActive(link.to) ? colors.primary : colors.mediumText,
                  backgroundColor: isActive(link.to) ? `${colors.primary}15` : 'transparent',
                  fontWeight: isActive(link.to) ? '600' : '400',
                  fontSize: '0.9rem', transition: '150ms ease-in-out',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Users link — admin only */}
            {role === 'admin' && (
              <Link
                to="/users"
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing.md,
                  padding: `${spacing.md} ${spacing.lg}`, margin: `2px ${spacing.sm}`,
                  borderRadius: '8px', textDecoration: 'none',
                  color: isActive('/users') ? colors.primary : colors.mediumText,
                  backgroundColor: isActive('/users') ? `${colors.primary}15` : 'transparent',
                  fontWeight: isActive('/users') ? '600' : '400',
                  fontSize: '0.9rem', transition: '150ms ease-in-out',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>👥</span>
                Users
              </Link>
            )}

            {/* Settings link — all users */}
            <Link
              to="/settings"
              style={{
                display: 'flex', alignItems: 'center', gap: spacing.md,
                padding: `${spacing.md} ${spacing.lg}`, margin: `2px ${spacing.sm}`,
                borderRadius: '8px', textDecoration: 'none',
                color: isActive('/settings') ? colors.primary : colors.mediumText,
                backgroundColor: isActive('/settings') ? `${colors.primary}15` : 'transparent',
                fontWeight: isActive('/settings') ? '600' : '400',
                fontSize: '0.9rem', transition: '150ms ease-in-out',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>⚙️</span>
              Settings
            </Link>
          </nav>

          {/* User info at bottom */}
          {user && (
            <div style={{ padding: spacing.lg, borderTop: `1px solid ${colors.border}` }}>
              <p style={{
                margin: `0 0 ${spacing.sm} 0`, fontSize: '0.75rem', color: colors.lightText,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {displayName}
              </p>
              <LanguageSwitcher />
              <div style={{ marginTop: spacing.sm }}>
                <Button variant="danger" size="sm" onClick={logout} style={{ width: '100%' }}>
                  {t('logout')}
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Top bar */}
          <header style={{
            height: '60px', backgroundColor: colors.white,
            borderBottom: `1px solid ${colors.border}`,
            padding: `0 ${spacing.xl}`, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
          }}>
            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: colors.lightText }}>
              {t(navLinks.find(l => isActive(l.to))?.labelKey) || 'MachTrack'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LanguageSwitcher />
              <span style={{ fontSize: '0.8rem', color: colors.lightText }}>{displayName}</span>
            </div>
          </header>

          <main style={{ flex: 1, padding: spacing.xl }}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // ── TABLET / MOBILE LAYOUT ───────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: colors.background }}>

      {/* Top Header */}
      <header style={{
        height: '60px', backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: `0 ${spacing.lg}`, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div style={{
            width: '30px', height: '30px', backgroundColor: colors.primary,
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.9rem',
          }}>🏭</div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.darkText }}>MachTrack</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <LanguageSwitcher />
          {user && (
            <span style={{
              fontSize: '0.75rem', color: colors.lightText,
              maxWidth: '140px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName}
            </span>
          )}
          {user && (
            <Button variant="danger" size="sm" onClick={logout}>
              {t('logout')}
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: spacing.lg, paddingBottom: '80px' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '68px',
        backgroundColor: colors.white, borderTop: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'stretch', zIndex: 100,
      }}>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: isActive(link.to) ? colors.primary : colors.lightText,
              backgroundColor: 'transparent',
              borderTop: isActive(link.to) ? `3px solid ${colors.primary}` : '3px solid transparent',
              fontSize: '0.7rem', fontWeight: isActive(link.to) ? '600' : '400',
              transition: '150ms ease-in-out',
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>{link.icon}</span>
            {t(link.labelKey)}
          </Link>
        ))}

        {/* Users — admin only */}
        {role === 'admin' && (
          <Link
            to="/users"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: isActive('/users') ? colors.primary : colors.lightText,
              backgroundColor: 'transparent',
              borderTop: isActive('/users') ? `3px solid ${colors.primary}` : '3px solid transparent',
              fontSize: '0.7rem', fontWeight: isActive('/users') ? '600' : '400',
              transition: '150ms ease-in-out',
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>👥</span>
            Users
          </Link>
        )}

        {/* Settings — all users */}
        <Link
          to="/settings"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '3px',
            textDecoration: 'none',
            color: isActive('/settings') ? colors.primary : colors.lightText,
            backgroundColor: 'transparent',
            borderTop: isActive('/settings') ? `3px solid ${colors.primary}` : '3px solid transparent',
            fontSize: '0.7rem', fontWeight: isActive('/settings') ? '600' : '400',
            transition: '150ms ease-in-out',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>⚙️</span>
          Settings
        </Link>
      </nav>
    </div>
  );
}

export default AppLayout;