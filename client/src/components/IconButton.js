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
    const baseClasses = `
        relative flex items-center justify-center
        w-10 h-10 rounded-lg
        transition-all duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
        ${isActive 
            ? 'bg-[var(--color-primary)] text-white shadow-md' 
            : 'text-gray-700 hover:text-[var(--color-primary)] hover:bg-gray-100 active:bg-gray-200'
        }
    `;

    const content = (
        <>
            {hasBadge && (
                <div 
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white z-10"
                    aria-label={badgeLabel || 'Notification'}
                />
            )}

            <div className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-white' : 'text-gray-700'}`}>
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
