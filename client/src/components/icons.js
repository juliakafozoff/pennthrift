/**
 * Inline SVG icons for navigation
 * All icons are 20x20 viewBox with consistent stroke width (2)
 */

export const ShoppingBagIcon = ({ className = "w-5 h-5" }) => (
    <svg 
        className={className}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
        />
    </svg>
);

export const MessagesIcon = ({ className = "w-5 h-5" }) => (
    <svg 
        className={className}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
    </svg>
);

export const HeartIcon = ({ className = "w-5 h-5" }) => (
    <svg 
        className={className}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
    </svg>
);

/**
 * Venmo icon - stylized "V" mark
 * Uses Venmo blue (#3D95CE) or currentColor for flexibility
 */
export const VenmoIcon = ({ className = "w-4 h-4", color = "#3D95CE" }) => (
    <svg 
        className={className}
        fill={color}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Venmo"
        role="img"
    >
        <path d="M19.5 2C20.88 2 22 3.12 22 4.5v15c0 1.38-1.12 2.5-2.5 2.5h-15C3.12 22 2 20.88 2 19.5v-15C2 3.12 3.12 2 4.5 2h15zm-1.98 13.12c-.08 1.56-.77 2.95-2.07 4.08-.8.7-1.83 1.17-3.18 1.34v-4.2h-.15c-1.23-.06-2.27-.49-3.13-1.28-.43-.4-.75-.85-.97-1.36-.22-.5-.33-1.05-.33-1.64 0-1.3.42-2.42 1.26-3.36.84-.94 1.96-1.41 3.36-1.41.5 0 .98.06 1.44.18.46.12.88.3 1.26.54v-3.3h2.25v13.5h-1.5v-3.45zm-2.25-5.4c-.3-.18-.64-.32-1.02-.42-.38-.1-.78-.15-1.2-.15-.96 0-1.73.3-2.31.9-.58.6-.87 1.38-.87 2.34 0 .48.08.93.24 1.35.16.42.4.8.72 1.14.32.34.72.6 1.2.78.48.18 1.02.27 1.62.27h.15V9.72h-.12z"/>
    </svg>
);

