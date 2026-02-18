import React from 'react';

/**
 * Field component - Label + control + helper/error text
 */
export const Field = ({ 
  label, 
  required = false, 
  error, 
  helperText, 
  children, 
  className = '',
  labelClassName = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium text-[var(--color-text)] ${labelClassName}`}>
          {label}
          {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-[var(--color-muted)]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Field;

