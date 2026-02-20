import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../api/ProfileAPI';
import { normalizeImageUrl, getUserInitial } from '../utils/imageUtils';

const TopNav = ({ unreadCount = 0 }) => {
    const location = useLocation();
    const { isAuthenticated, user: authUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [avatarFailed, setAvatarFailed] = useState(false);

    // Fetch user profile to get profile_pic
    useEffect(() => {
        if (isAuthenticated && authUser?.username) {
            getUserProfile(authUser.username)
                .then(profile => {
                    setUserProfile(profile);
                    setAvatarFailed(false);
                })
                .catch(err => {
                    console.error('Error fetching user profile for nav:', err);
                });
        }
    }, [isAuthenticated, authUser?.username]);

    // Determine active route
    const pathname = location.pathname;
    const isStoreActive = pathname === '/store' || pathname.startsWith('/store/item');
    const isMessagesActive = pathname.startsWith('/profile/messages');
    const isSavedActive = pathname === '/profile/favourites';
    const isProfileActive = pathname === '/profile' || pathname === '/profile/edit' || pathname === '/profile/analytics' || pathname === '/profile/newitem';

    // Get avatar URL
    const avatarUrl = userProfile?.profile_pic 
        ? normalizeImageUrl(userProfile.profile_pic) 
        : null;
    const username = authUser?.username || userProfile?.username || '';
    const initial = getUserInitial(username);

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
            badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null
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
            icon: null, // Will render avatar instead
            isActive: isProfileActive,
            ariaLabel: 'Your profile'
        }
    ];

    return (
        <nav 
            className="flex items-center gap-1 sm:gap-2"
            aria-label="Main navigation"
        >
            {navItems.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    className={`
                        relative p-2 sm:p-2.5 rounded-lg 
                        transition-all duration-200
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]
                        ${item.isActive 
                            ? 'bg-[var(--color-primary)] text-white shadow-md' 
                            : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text)]'
                        }
                    `}
                    aria-label={item.ariaLabel}
                    aria-current={item.isActive ? 'page' : undefined}
                >
                    {/* Badge for unread messages */}
                    {item.badge && (
                        <div 
                            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold text-white bg-[var(--color-danger)] rounded-full z-10"
                            aria-label={`${item.badge} unread messages`}
                        >
                            {item.badge}
                        </div>
                    )}
                    
                    {/* Active indicator - background color already applied via className */}

                    {/* Icon or Avatar */}
                    {item.to === '/profile' ? (
                        // Profile avatar
                        <div className="relative">
                            {avatarUrl && !avatarFailed ? (
                                <>
                                    <img
                                        src={avatarUrl}
                                        alt={username}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-current"
                                        onError={() => {
                                            setAvatarFailed(true);
                                        }}
                                    />
                                    {item.isActive && (
                                        <div className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-1 ring-offset-[var(--color-primary)]" />
                                    )}
                                </>
                            ) : (
                                <div 
                                    className={`
                                        w-7 h-7 sm:w-8 sm:h-8 rounded-full 
                                        flex items-center justify-center 
                                        font-semibold text-sm sm:text-base
                                        border-2 border-current
                                        ${item.isActive 
                                            ? 'bg-white text-[var(--color-primary)]' 
                                            : 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                                        }
                                    `}
                                >
                                    {initial}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Regular icon
                        <img
                            src={item.icon}
                            alt={item.label}
                            className={`w-6 h-6 sm:w-7 sm:h-7 ${item.isActive ? 'brightness-0 invert' : ''}`}
                        />
                    )}
                </Link>
            ))}
        </nav>
    );
};

export default TopNav;

