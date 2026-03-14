import React from 'react';
import { colors, spacing, borderRadius, typography } from '../constants/designTokens';

function Input({ type = 'text', placeholder = '', value, onChange, disabled = false, style = {} }) {
  const inputStyle = {
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.body.fontSize,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: disabled ? colors.borderLight : colors.white,
    color: disabled ? colors.disabledText : colors.darkText,
    outline: 'none',
    transition: '150ms ease-in-out',
    ':focus': {
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px ${colors.primary}20`,
    },
    ...style,
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={inputStyle}
    />
  );
}

export default Input;
