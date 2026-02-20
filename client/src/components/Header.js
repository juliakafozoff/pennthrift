import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/ProfileAPI';
import io from 'socket.io-client';
import React from 'react';
import { path } from '../api/ProfileAPI';
import { Button, Badge } from './ui';
import { useAuth } from '../contexts/AuthContext';
import TopNav from './TopNav';
import AboutPopover from './AboutPopover';


const Header = props =>{
    const navigate = useNavigate();
    const { isAuthenticated, user: authUser, logout: logoutFromContext, demoLogin } = useAuth();
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
            
            // Navigate to landing page (Welcome to PennThrift!)
            console.log('🔴 [LOGOUT] About to navigate to /');
            navigate('/', { replace: true });
            console.log('🟢 [LOGOUT] Navigate() called - navigation should occur');
        } catch (error) {
            console.error('❌ [LOGOUT] Logout error:', error);
            // Navigate anyway - auth context should have cleared state
            navigate('/', { replace: true });
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
            // Safely extract unread count: default to empty array if missing/invalid
            const unreadSafe = Array.isArray(profile?.unread) ? profile.unread : [];
            const count = unreadSafe.length;
            // Only set if count is a valid number (defensive check)
            setUnread(typeof count === 'number' && count >= 0 ? count : 0);
        } catch (e) {
            // On any error (network, 401, missing data), default to 0 (no badge)
            // This prevents false positives
            if (e?.response?.status === 401) {
                // User not authenticated, clear unread count
                setUnread(0);
            } else {
                console.error('Error updating unread:', e);
                setUnread(0);
            }
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
                <div className="flex items-center justify-between h-20 gap-4">
                    {/* Left side - Brand lockup */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <AboutPopover trigger="hover">
                            <div className="flex items-center gap-3 cursor-pointer">
                                <img 
                                    src={require('../assets/logo.png')} 
                                    alt="PennThrift logo" 
                                    className="block h-8 w-8 object-contain"
                                    style={{ transform: 'translateY(1px)' }}
                                />
                                <div className="inline-flex items-center gap-1.5">
                                    <Link 
                                        to={isAuthenticated ? "/store" : "/"} 
                                        className="inline-block text-2xl font-semibold text-gray-900 hover:opacity-80 transition-opacity hidden sm:inline"
                                        style={{ lineHeight: '1.1' }}
                                        aria-label="PennThrift home"
                                    >
                                        PennThrift
                                    </Link>
                                    <button
                                        className="inline-block text-gray-500 hover:text-gray-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                                        aria-label="About PennThrift"
                                        style={{ 
                                            fontSize: '14px', 
                                            lineHeight: '1',
                                            opacity: '0.65',
                                            padding: 0,
                                            border: 'none',
                                            background: 'none',
                                            transform: 'translate(4px, 2px)'
                                        }}
                                        type="button"
                                    >
                                        ⓘ
                                    </button>
                                </div>
                            </div>
                        </AboutPopover>
                    </div>

                    {/* Right side - Navigation */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isAuthenticated && authUser ? (
                            <>
                                {authUser.username === 'demo' && (
                                    <Badge variant="primary" className="mr-2">
                                        Demo
                                    </Badge>
                                )}
                                <TopNav unreadCount={unread} onLogout={logOut} />
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="primary" 
                                    className="text-sm"
                                    onClick={async () => {
                                        try {
                                            await demoLogin();
                                            // Auth context will update automatically
                                        } catch (error) {
                                            console.error('Demo login failed:', error);
                                        }
                                    }}
                                >
                                    Try Demo
                                </Button>
                                <Link to="/login">
                                    <Button variant="secondary" className="text-sm">
                                        Log in
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )

}

export default Header;