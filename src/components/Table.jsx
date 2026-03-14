import React from 'react';
import { colors, spacing, typography, borderRadius } from '../constants/designTokens';

function Table({ columns, data, style = {} }) {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    ...style,
  };

  const headerStyle = {
    backgroundColor: colors.borderLight,
    padding: spacing.lg,
    textAlign: 'left',
    fontWeight: '600',
    color: colors.mediumText,
    fontSize: typography.body.fontSize,
    borderBottom: `1px solid ${colors.border}`,
  };

  const cellStyle = {
    padding: spacing.lg,
    color: colors.darkText,
    fontSize: typography.body.fontSize,
    borderBottom: `1px solid ${colors.borderLight}`,
  };

  const rowStyle = {
    backgroundColor: colors.white,
    ':hover': {
      backgroundColor: colors.borderLight,
    },
  };

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} style={headerStyle}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} style={rowStyle}>
            {columns.map((column) => (
              <td key={column.key} style={cellStyle}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
