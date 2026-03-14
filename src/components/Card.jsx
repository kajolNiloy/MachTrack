import React from 'react';
import { colors, spacing, shadows, borderRadius } from '../constants/designTokens';

function Card({ children, style = {}, ...props }) {
  const cardStyle = {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
    ...style,
  };

  return <div style={cardStyle} {...props}>{children}</div>;
}

export default Card;
