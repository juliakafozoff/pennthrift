import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AvatarMenu from './AvatarMenu';
import IconButton from './IconButton';
import { ShoppingBagIcon, MessagesIcon, HeartIcon } from './icons';

const TopNav = ({ onLogout }) => {
    const location = useLocation();
    const { isAuthenticated, user: authUser } = useAuth();

    // Determine active route
    const pathname = location.pathname;
    const isStoreActive = pathname === '/store' || pathname.startsWith('/store/item');
    const isMessagesActive = pathname.startsWith('/profile/messages');
    const isSavedActive = pathname === '/profile/favourites';
    const isProfileActive = pathname === '/profile' || pathname === '/profile/edit' || pathname === '/profile/analytics' || pathname === '/profile/newitem';

    // Nav items configuration
    const navItems = [
        {
            to: '/store',
            label: 'Market',
            icon: <ShoppingBagIcon />,
            isActive: isStoreActive,
            ariaLabel: 'Browse marketplace'
        },
        {
            to: '/profile/messages',
            label: 'Messages',
            icon: <MessagesIcon />,
            isActive: isMessagesActive,
            ariaLabel: 'Messages'
        },
        {
            to: '/profile/favourites',
            label: 'Saved',
            icon: <HeartIcon />,
            isActive: isSavedActive,
            ariaLabel: 'Saved items'
        },
        {
            to: '/profile',
            label: 'Profile',
            icon: null,
            isActive: isProfileActive,
            ariaLabel: 'Your profile',
            isMenu: true
        }
    ];

    return (
        <nav 
            className="inline-flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-2 py-1.5 gap-1.5"
            aria-label="Main navigation"
            role="navigation"
        >
            {navItems.map((item) => (
                item.isMenu ? (
                    <AvatarMenu key={item.to} onLogout={onLogout} />
                ) : (
                    <IconButton
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        ariaLabel={item.ariaLabel}
                        isActive={item.isActive}
                        hasBadge={item.hasBadge}
                        badgeLabel={item.badgeLabel}
                    />
                )
            ))}
        </nav>
    );
};

export default TopNav;
