// Design Tokens - Single source of truth for all styles
export const colors = {
  // Primary
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryDark: '#1d4ed8',

  // Success
  success: '#16a34a',
  successHover: '#15803d',

  // Danger
  danger: '#dc2626',
  dangerHover: '#b91c1c',

  // Maintenance
  maintenance: '#7c3aed',
  maintenanceHover: '#6d28d9',

  // Neutrals
  background: '#f8fafc',
  white: '#ffffff',
  darkText: '#1f2937',
  mediumText: '#374151',
  lightText: '#6b7280',
  disabledText: '#9ca3af',

  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

export const typography = {
  pageTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    lineHeight: '1.2',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  body: {
    fontSize: '0.875rem',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  small: {
    fontSize: '0.75rem',
    fontWeight: '400',
    lineHeight: '1.4',
  },
};

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
};

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out',
};
