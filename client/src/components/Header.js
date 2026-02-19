import api from '../api/http';
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/ProfileAPI';
import io from 'socket.io-client';
import React from 'react';
import { path } from '../api/ProfileAPI';
import { Button } from './ui';


const Header = props =>{
    const navigate = useNavigate()
    const [user, setUser] = useState();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [unread, setUnread] = useState(0);
    const [processing , setProcessing] = useState(false)
    const socketRef = useRef(null);

    function logOut(){
        api.post('/api/auth/logout').then(res => {
            setIsAuthenticated(false);
            navigate('/login', { replace: true });
        });
    }
    async function setUp(){
        try {
            // Check authentication status using GET /api/auth
            const authRes = await api.get('/api/auth/').catch(e => {
                console.error('Error checking auth:', e);
                return {data: {authenticated: false, user: null}};
            });
            
            const { authenticated, user: authUser } = authRes.data;
            setIsAuthenticated(authenticated);
            
            if(authenticated && authUser){
                setUser(authUser.username);
                try {
                    const profile = await getUserProfile(authUser.username);
                    const unreadSafe = Array.isArray(profile?.unread) ? profile.unread : [];
                    setUnread(unreadSafe.length);
                } catch (e) {
                    console.error('Error loading profile:', e);
                    setUnread(0);
                }
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error('Error in setUp:', e);
            setIsAuthenticated(false);
        }
    }

    async function updateUnread(){
        if(user && !processing){
            setProcessing(true)
            try {
                const profile = await getUserProfile(user);
                const unreadSafe = Array.isArray(profile?.unread) ? profile.unread : [];
                setUnread(unreadSafe.length);
            } catch (e) {
                console.error('Error updating unread:', e);
            } finally {
                setProcessing(false);
            }
        }
    }
    
    useEffect(() => {
        setUp();
    }, []); // Run once on mount to check auth
    
    useEffect(() => {
        // Initialize socket only when authenticated and user is available
        if (typeof window !== 'undefined' && path && isAuthenticated && user) {
            try {
                if (!socketRef.current) {
                    socketRef.current = io.connect(`${path}/api/messages`, {
                        withCredentials: true,
                        transports: ['websocket', 'polling']
                    });
                    
                    socketRef.current.on('unread', () => {
                        updateUnread();
                    });
                }
            } catch (e) {
                console.error('Error initializing socket:', e);
            }
        }
        
        // Cleanup on unmount or when auth/user changes
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, user])

   
    return(
        <header 
            data-testid="header" 
            className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm sticky top-0 z-50"
        >
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Auth */}
                    <div className="flex items-center">
                        {isAuthenticated ? (
                            <Button
                                data-testid="logout"
                                variant="ghost"
                                onClick={logOut}
                                className="text-sm"
                            >
                                Logout
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