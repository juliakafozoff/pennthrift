import { Link } from 'react-router-dom';
import { cloneElement } from 'react';

/**
 * Reusable icon button component for navigation
 * Provides consistent sizing, hover states, and accessibility
 */
const IconButton = ({ 
    to, 
    icon, 
    ariaLabel, 
    isActive = false, 
    hasBadge = false,
    badgeLabel,
    onClick 
}) => {
    // FIX: Ensure active icons are always visible
    // Active state: white icons on navy background (always visible)
    // Default state: dark gray icons (always visible)
    // Hover: enhancement only, doesn't affect visibility
    const baseClasses = `
        relative flex items-center justify-center
        w-10 h-10 rounded-lg
        transition-all duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
        ${isActive 
            ? 'bg-[var(--color-primary)] shadow-md' 
            : 'hover:bg-gray-100 active:bg-gray-200'
        }
    `;

    // FIX: Ensure icons are always visible by explicitly setting color via inline styles
    // This bypasses any CSS specificity issues and ensures SVG stroke="currentColor" works
    // Active: white icons (#ffffff) on navy background
    // Default: dark gray icons (#374151 = gray-700), always visible
    const iconColor = isActive ? '#ffffff' : '#374151';
    
    // Clone icon element to inject explicit color style directly on SVG
    // This ensures stroke="currentColor" inherits the correct color
    const iconWithColor = icon ? cloneElement(icon, {
        style: {
            color: iconColor,
            ...icon.props?.style
        },
        className: `${icon.props?.className || 'w-5 h-5'}`
    }) : null;

    // Icon wrapper classes - hover enhancement for non-active icons
    const iconWrapperClasses = `
        w-5 h-5 flex items-center justify-center
        ${!isActive ? 'hover:[&>svg]:text-[var(--color-primary)]' : ''}
    `;

    const content = (
        <>
            {/* Badge indicator */}
            {hasBadge && (
                <div 
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white z-10"
                    aria-label={badgeLabel || 'Notification'}
                />
            )}

            {/* Icon wrapper - inline style ensures base color is always applied */}
            <div 
                className={iconWrapperClasses}
                style={{ 
                    zIndex: 1,
                    color: iconColor // Base color always set, ensures visibility
                }}
            >
                {iconWithColor}
            </div>
        </>
    );

    if (to) {
        return (
            <Link
                to={to}
                className={baseClasses}
                aria-label={ariaLabel}
                aria-current={isActive ? 'page' : undefined}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            className={baseClasses}
            aria-label={ariaLabel}
        >
            {content}
        </button>
    );
};

export default IconButton;

