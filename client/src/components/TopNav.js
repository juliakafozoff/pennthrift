import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AvatarMenu from './AvatarMenu';

const TopNav = ({ unreadCount = 0, onLogout }) => {
    const location = useLocation();
    const { isAuthenticated, user: authUser } = useAuth();
    // Profile avatar is now handled by AvatarMenu component

    // Determine active route
    const pathname = location.pathname;
    const isStoreActive = pathname === '/store' || pathname.startsWith('/store/item');
    const isMessagesActive = pathname.startsWith('/profile/messages');
    const isSavedActive = pathname === '/profile/favourites';
    const isProfileActive = pathname === '/profile' || pathname === '/profile/edit' || pathname === '/profile/analytics' || pathname === '/profile/newitem';

    const hasUnread = unreadCount > 0;

    // Nav items configuration
    const navItems = [
        {
            to: '/store',
            label: 'Market',
            icon: require('../assets/shop_bag.png'),
            isActive: isStoreActive,
            ariaLabel: 'Browse marketplace'
        },
        {
            to: '/profile/messages',
            label: 'Messages',
            icon: require('../assets/messages.png'),
            isActive: isMessagesActive,
            ariaLabel: 'Messages',
            hasUnread: hasUnread
        },
        {
            to: '/profile/favourites',
            label: 'Saved',
            icon: require('../assets/favourite.png'),
            isActive: isSavedActive,
            ariaLabel: 'Saved items'
        },
        {
            to: '/profile',
            label: 'Profile',
            icon: null, // Will render avatar menu instead
            isActive: isProfileActive,
            ariaLabel: 'Your profile',
            isMenu: true // Flag to render AvatarMenu instead of Link
        }
    ];

    return (
        <nav 
            className="inline-flex items-center bg-white border border-gray-200 rounded-full shadow-sm px-1 py-1 gap-0.5"
            aria-label="Main navigation"
            role="navigation"
        >
            {navItems.map((item) => (
                <div key={item.to} className="relative group">
                    {item.isMenu ? (
                        // Profile menu (AvatarMenu component)
                        <AvatarMenu onLogout={onLogout} unreadCount={unreadCount} />
                    ) : (
                        // Regular navigation link
                        <>
                            <Link
                                to={item.to}
                                className={`
                                    relative flex items-center justify-center
                                    w-11 h-11 rounded-full
                                    transition-all duration-200 ease-in-out
                                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]
                                    ${item.isActive 
                                        ? 'bg-[var(--color-primary)] text-white shadow-md scale-105' 
                                        : 'hover:bg-gray-100 text-gray-700 hover:scale-105'
                                    }
                                `}
                                aria-label={item.ariaLabel}
                                aria-current={item.isActive ? 'page' : undefined}
                                title={item.label}
                            >
                                {/* Unread indicator dot for Messages */}
                                {item.hasUnread && (
                                    <div 
                                        className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white z-10"
                                        aria-label="Unread messages"
                                    />
                                )}

                                {/* Regular icon */}
                                <img
                                    src={item.icon}
                                    alt={item.label}
                                    className={`w-5 h-5 ${item.isActive ? 'brightness-0 invert' : 'opacity-80 group-hover:opacity-100'}`}
                                />
                            </Link>
                            
                            {/* Tooltip - only show on desktop (hover) */}
                            <div 
                                className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
                                role="tooltip"
                            >
                                {item.label}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </nav>
    );
};

export default TopNav;
