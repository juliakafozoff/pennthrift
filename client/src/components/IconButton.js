import { Link } from 'react-router-dom';

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

    // Icon wrapper with explicit color classes to ensure SVG stroke inherits correctly
    // Active: white stroke on navy background
    // Default: dark gray stroke, always visible
    const iconWrapperClasses = `
        w-5 h-5 flex items-center justify-center
        ${isActive 
            ? 'text-white' 
            : 'text-gray-700 hover:text-[var(--color-primary)]'
        }
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

            {/* Icon wrapper - ensures SVG stroke="currentColor" inherits visible color */}
            {/* SVG icons use stroke="currentColor" which inherits from parent text color */}
            <div className={iconWrapperClasses} style={{ zIndex: 1 }}>
                {icon}
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

