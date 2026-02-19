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
  // Use stable CSS classes with scoped prefix to avoid conflicts with Semantic UI
  // pt-button prefix ensures our styles override Semantic UI and Tailwind preflight
  const variantClasses = {
    primary: 'pt-button pt-button--primary',
    secondary: 'pt-button pt-button--secondary',
    ghost: 'pt-button pt-button--ghost',
    danger: 'pt-button pt-button--danger'
  };
  
  return (
    <button
      type={type}
      className={`${variantClasses[variant]} ${className}`}
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

