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
            ? 'shadow-md' 
            : 'hover:bg-gray-100 active:bg-gray-200'
        }
    `;
    
    // GUARANTEED FIX: Use inline style for active background color
    // This bypasses Tailwind arbitrary value emission issues and CSS specificity conflicts
    // Tailwind's bg-[var(--color-primary)] may not be emitted, and Semantic UI's
    // a { background-color: transparent; } could override it. Inline styles have highest specificity.
    const activeBackgroundStyle = isActive 
        ? { backgroundColor: 'var(--color-primary)' }
        : {};

    // FIX: Ensure icons are always visible by explicitly setting color via inline styles
    // This bypasses any CSS specificity issues and ensures SVG stroke="currentColor" works
    // Active: white icons (#ffffff) on navy background
    // Default: dark gray icons (#374151 = gray-700), always visible
    const iconColor = isActive ? '#ffffff' : '#374151';
    
    // Clone icon element to inject explicit stroke color directly on SVG
    // ROOT CAUSE FIX: Global CSS rule `a { color: var(--color-primary) }` in theme.css (line 85)
    // was overriding our inline color styles. By setting stroke directly on SVG, we bypass
    // the currentColor inheritance chain and ensure the icon is always visible.
    const iconWithColor = icon ? cloneElement(icon, {
        stroke: iconColor, // Set stroke directly - bypasses currentColor inheritance issues
        style: {
            color: iconColor, // Also set color for any other uses
            ...icon.props?.style
        },
        className: `${icon.props?.className || 'w-5 h-5'} ${!isActive ? 'nav-icon-hover' : ''}`
    }) : null;

    // Icon wrapper classes - hover enhancement for non-active icons
    // Note: hover color change handled via CSS class since we're setting stroke directly
    const iconWrapperClasses = `
        w-5 h-5 flex items-center justify-center
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
                style={{
                    // Fix: Override global link color rule (theme.css line 85-93)
                    // Global rule sets all <a> tags to var(--color-primary), which conflicts with active white icons
                    color: 'inherit', // Let children control color, don't inherit from global link rule
                    textDecoration: 'none', // Ensure no underline
                    ...activeBackgroundStyle // Apply active background color via inline style (guaranteed to work)
                }}
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
            style={activeBackgroundStyle} // Apply active background color via inline style (guaranteed to work)
        >
            {content}
        </button>
    );
};

export default IconButton;

