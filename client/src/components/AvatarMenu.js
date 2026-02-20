import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../api/ProfileAPI';
import { normalizeImageUrl, getUserInitial } from '../utils/imageUtils';

const AvatarMenu = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    const menuRef = useRef(null);
    const { isAuthenticated, user: authUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if profile is active
    const isProfileActive = location.pathname === '/profile' || 
        location.pathname === '/profile/edit' || 
        location.pathname === '/profile/analytics' || 
        location.pathname === '/profile/newitem';

    // Fetch user profile to get profile_pic
    useEffect(() => {
        if (isAuthenticated && authUser?.username) {
            setLoading(true);
            getUserProfile(authUser.username)
                .then(profile => {
                    setUserProfile(profile);
                    setAvatarFailed(false);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching user profile for menu:', err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, authUser?.username]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // Close menu on Escape key
    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Get avatar URL with fallbacks
    const avatarUrl = userProfile?.profile_pic || userProfile?.profilePic || userProfile?.avatar
        ? normalizeImageUrl(userProfile.profile_pic || userProfile.profilePic || userProfile.avatar)
        : null;
    const username = authUser?.username || userProfile?.username || '';
    const initial = getUserInitial(username);

    const handleLogout = () => {
        setIsOpen(false);
        if (onLogout) {
            onLogout();
        }
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        navigate('/profile');
    };

    if (!isAuthenticated || !authUser) {
        return null;
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative flex items-center justify-center
                    w-10 h-10 rounded-lg
                    transition-all duration-200 ease-in-out
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
                    ${isOpen || isProfileActive
                        ? 'bg-[var(--color-primary)] text-white' 
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }
                `}
                aria-label="Profile menu"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {/* Avatar */}
                <div className="relative w-8 h-8">
                    {!loading && avatarUrl && !avatarFailed ? (
                        <img
                            src={avatarUrl}
                            alt={username || 'Profile'}
                            className="w-full h-full rounded-full object-cover"
                            onError={() => {
                                setAvatarFailed(true);
                            }}
                        />
                    ) : (
                        <div 
                            className={`
                                w-full h-full rounded-full 
                                flex items-center justify-center 
                                font-semibold text-sm
                                ${isOpen || isProfileActive
                                    ? 'bg-white text-[var(--color-primary)]' 
                                    : 'bg-gray-200 text-gray-600'
                                }
                            `}
                        >
                            {initial}
                        </div>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        role="menuitem"
                    >
                        <span>Profile</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        role="menuitem"
                    >
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvatarMenu;

