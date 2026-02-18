import React from 'react';

/**
 * Input component - consistent styling with focus states
 */
export const Input = React.forwardRef(({ 
  error, 
  className = '', 
  ...props 
}, ref) => {
  const baseClasses = 'w-full min-h-[44px] px-4 py-2.5 border rounded-lg text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  const errorClasses = error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : 'border-[var(--color-border)]';
  
  return (
    <input
      ref={ref}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;

