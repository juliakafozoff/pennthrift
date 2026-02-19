import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/ProfileAPI';
import io from 'socket.io-client';
import React from 'react';
import { path } from '../api/ProfileAPI';
import { Button } from './ui';
import { useAuth } from '../contexts/AuthContext';


const Header = props =>{
    const navigate = useNavigate();
    const { isAuthenticated, user: authUser, logout: logoutFromContext } = useAuth();
    const [unread, setUnread] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const socketRef = useRef(null);
    const unreadIntervalRef = useRef(null);

    async function logOut(){
        // Prevent multiple simultaneous logout attempts
        if (loggingOut) {
            console.log('⚠️ [LOGOUT] Logout already in progress, ignoring click');
            return;
        }
        
        console.log('🔴 [LOGOUT] ============================================');
        console.log('🔴 [LOGOUT] Logout click handler triggered');
        setLoggingOut(true);
        
        try {
            console.log('🔴 [LOGOUT] Starting logout process...');
            
            // Stop all intervals/polling
            if (unreadIntervalRef.current) {
                clearInterval(unreadIntervalRef.current);
                unreadIntervalRef.current = null;
                console.log('🟢 [LOGOUT] Cleared unread interval');
            }
            
            // Disconnect socket before logout
            if (socketRef.current) {
                console.log('🔴 [LOGOUT] Disconnecting socket...');
                socketRef.current.disconnect();
                socketRef.current = null;
                console.log('🟢 [LOGOUT] Socket disconnected successfully');
            }
            
            // Call logout from context (handles API call and auth state)
            await logoutFromContext();
            
            console.log('🟢 [LOGOUT] Logout complete');
            
            // Navigate to login
            console.log('🔴 [LOGOUT] About to navigate to /login');
            navigate('/login', { replace: true });
            console.log('🟢 [LOGOUT] Navigate() called - navigation should occur');
        } catch (error) {
            console.error('❌ [LOGOUT] Logout error:', error);
            // Navigate anyway - auth context should have cleared state
            navigate('/login', { replace: true });
        } finally {
            console.log('🔴 [LOGOUT] Finally block executing');
            setLoggingOut(false);
            console.log('🟢 [LOGOUT] loggingOut state:', false);
            console.log('🔴 [LOGOUT] ============================================');
        }
    }

    async function updateUnread(){
        if (!authUser || !isAuthenticated || processing) return;
        
        setProcessing(true);
        try {
            const profile = await getUserProfile(authUser.username);
            const unreadSafe = Array.isArray(profile?.unread) ? profile.unread : [];
            setUnread(unreadSafe.length);
        } catch (e) {
            console.error('Error updating unread:', e);
            setUnread(0);
        } finally {
            setProcessing(false);
        }
    }
    
    // Load unread count when authenticated user changes
    useEffect(() => {
        if (isAuthenticated && authUser) {
            updateUnread();
        } else {
            setUnread(0);
        }
    }, [isAuthenticated, authUser?.username]);
    
    // Initialize socket only when authenticated
    useEffect(() => {
        if (typeof window !== 'undefined' && path && isAuthenticated && authUser) {
            try {
                if (!socketRef.current) {
                    socketRef.current = io.connect(`${path}/api/messages`, {
                        withCredentials: true,
                        transports: ['websocket', 'polling']
                    });
                    
                    socketRef.current.on('unread', () => {
                        if (isAuthenticated) {
                            updateUnread();
                        }
                    });
                }
            } catch (e) {
                console.error('Error initializing socket:', e);
            }
        } else {
            // Disconnect socket if not authenticated
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }
        
        // Cleanup on unmount or when auth changes
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (unreadIntervalRef.current) {
                clearInterval(unreadIntervalRef.current);
                unreadIntervalRef.current = null;
            }
        };
    }, [isAuthenticated, authUser?.username])

   
    return(
        <header 
            data-testid="header" 
            className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm sticky top-0 z-50"
        >
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Auth */}
                    <div className="flex items-center">
                        {isAuthenticated && authUser ? (
                            <Button
                                data-testid="logout"
                                variant="ghost"
                                onClick={logOut}
                                disabled={loggingOut}
                                className="text-sm"
                            >
                                {loggingOut ? 'Logging out...' : 'Logout'}
                            </Button>
                        ) : (
                            <Link to="/login">
                                <Button variant="primary" className="text-sm">
                                    Login
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Right side - Navigation */}
                    <nav data-testid="flex" className="flex items-center gap-2">
                        <Link 
                            to="/store"
                            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                            aria-label="Store"
                        >
                            <img 
                                className="w-6 h-6" 
                                src={require('../assets/shop_bag.png')}
                                alt="Store"
                            />
                        </Link>
                        
                        <Link 
                            data-testid="relative"
                            className="relative p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                            to="/profile/messages"
                            aria-label="Messages"
                        >
                            {unread > 0 && (
                                <div 
                                    data-testid="unread"
                                    className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold text-white bg-[var(--color-danger)] rounded-full"
                                >
                                    {unread > 9 ? '9+' : unread}
                                </div>
                            )}
                            <img 
                                data-testid="image"
                                className="w-6 h-6" 
                                src={require('../assets/messages.png')}
                                alt="Messages"
                            />
                        </Link>
                        
                        <Link 
                            to="/profile/favourites"
                            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                            aria-label="Favourites"
                        >
                            <img 
                                className="w-6 h-6" 
                                src={require('../assets/favourite.png')}
                                alt="Favourites"
                            />
                        </Link>
                        
                        <Link 
                            to="/profile"
                            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                            aria-label="Profile"
                        >
                            <img 
                                className="w-6 h-6 rounded-full" 
                                src={require('../assets/placeholder_user_sm.png')}
                                alt="Profile"
                            />
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )

}

export default Header;