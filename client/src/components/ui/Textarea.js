import React from 'react';

/**
 * Textarea component - consistent styling with focus states
 */
export const Textarea = React.forwardRef(({ 
  error, 
  className = '', 
  rows = 4,
  ...props 
}, ref) => {
  const baseClasses = 'w-full px-4 py-2.5 border rounded-lg text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none';
  const errorClasses = error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : 'border-[var(--color-border)]';
  
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

