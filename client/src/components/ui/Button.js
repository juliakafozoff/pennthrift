import React from 'react';
import { Spinner } from './Spinner';

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
          <Spinner className="h-5 w-5 -ml-1 mr-3" alt="" />
          Loading...
        </>
      ) : children}
    </button>
  );
};

export default Button;

