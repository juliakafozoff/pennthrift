import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AboutPopover = ({ children, trigger = 'hover' }) => {
    const { isAuthenticated, user: authUser } = useAuth();
    const isDemoUser = isAuthenticated && authUser?.username === 'demo';
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const popoverRef = useRef(null);
    const triggerRef = useRef(null);
    const timeoutRef = useRef(null);

    // Detect mobile vs desktop
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleMouseEnter = () => {
        if (trigger === 'hover' && !isMobile) {
            clearTimeout(timeoutRef.current);
            setIsOpen(true);
        }
    };

    const handleMouseLeave = () => {
        if (trigger === 'hover' && !isMobile) {
            timeoutRef.current = setTimeout(() => {
                setIsOpen(false);
            }, 150);
        }
    };

    const handleClick = (e) => {
        // On mobile or when trigger is click, toggle on click
        if (isMobile || trigger === 'click') {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
        // On desktop with hover trigger, click also works as fallback
        else if (trigger === 'hover') {
            setIsOpen(!isOpen);
        }
    };

    const handleFocus = () => {
        setIsOpen(true);
    };

    const handleBlur = (e) => {
        // Don't close if focus moves to popover
        if (!popoverRef.current?.contains(e.relatedTarget)) {
            setIsOpen(false);
        }
    };

    // Helper component for badge (Link if demo, span if not)
    const FeatureBadge = ({ to, children }) => {
        if (isDemoUser) {
            return (
                <Link 
                    to={to}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                >
                    {children}
                </Link>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                {children}
            </span>
        );
    };

    return (
        <div className="relative inline-block">
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="inline-block"
            >
                {children}
            </div>
            
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute z-50 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 left-0"
                    role="dialog"
                    aria-label="About PennThrift"
                    onMouseEnter={() => clearTimeout(timeoutRef.current)}
                    onMouseLeave={handleMouseLeave}
                >
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                        PennThrift
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                        Buying, trading, gifting, and thrifting at Penn.
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                        Browse as a guest. Try Demo to save items, message sellers, and post listings.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <FeatureBadge to="/store">
                            Search & filters
                        </FeatureBadge>
                        <FeatureBadge to="/profile/messages">
                            Real-time chat
                        </FeatureBadge>
                        <FeatureBadge to="/profile/newitem">
                            Post listings
                        </FeatureBadge>
                        <FeatureBadge to="/profile/favourites">
                            Wishlist
                        </FeatureBadge>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutPopover;

