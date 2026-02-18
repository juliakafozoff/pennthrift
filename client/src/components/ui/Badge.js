import React from 'react';

/**
 * Badge/Chip component for tags, conditions, etc.
 */
export const Badge = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    default: 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]',
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-700'
  };
  
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

