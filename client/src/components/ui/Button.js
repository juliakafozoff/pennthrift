import React from 'react';

/**
 * Button component with variants: primary, secondary, ghost
 * Accessible with proper focus states and minimum 44px tap target
 */
export const Button = ({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg font-medium text-base transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-[var(--color-primary)]',
    secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)] focus-visible:outline-[var(--color-primary)]',
    ghost: 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:outline-[var(--color-primary)]',
    danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)] focus-visible:outline-[var(--color-danger)]'
  };
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
};

export default Button;

