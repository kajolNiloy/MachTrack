import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../constants/designTokens';

function Button({ children, variant = 'primary', size = 'md', disabled = false, onClick, type = 'button', style = {} }) {
  const baseStyle = {
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: transitions.fast,
    ...typography.body,
    ...style,
  };

  const sizeStyles = {
    sm: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: '0.75rem',
    },
    md: {
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: '0.875rem',
    },
    lg: {
      padding: `${spacing.lg} ${spacing.xl}`,
      fontSize: '1rem',
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? colors.disabledText : colors.primary,
      color: colors.white,
      ':hover': {
        backgroundColor: colors.primaryHover,
      },
    },
    secondary: {
      backgroundColor: colors.white,
      color: colors.darkText,
      border: `1px solid ${colors.border}`,
      ':hover': {
        backgroundColor: colors.borderLight,
      },
    },
    danger: {
      backgroundColor: disabled ? colors.disabledText : colors.danger,
      color: colors.white,
      ':hover': {
        backgroundColor: colors.dangerHover,
      },
    },
    success: {
      backgroundColor: disabled ? colors.disabledText : colors.success,
      color: colors.white,
      ':hover': {
        backgroundColor: colors.successHover,
      },
    },
    maintenance: {
      backgroundColor: disabled ? colors.disabledText : colors.maintenance,
      color: colors.white,
      ':hover': {
        backgroundColor: colors.maintenanceHover,
      },
    },
  };

  const finalStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <button style={finalStyle} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export default Button;
