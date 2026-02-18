import React from 'react';

/**
 * Card component - surface container with padding, border, and shadow
 */
export const Card = ({ children, className = '', padding = 'default', ...props }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

