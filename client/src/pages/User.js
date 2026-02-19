import api from "../api/http";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import placeholder from '../assets/placeholder_user.png';
import StoreItems from '../components/StoreItems';
import { updateViews, getUserProfile } from "../api/ProfileAPI";
import { useParams, useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import { path } from "../api/ProfileAPI";
import { useAuth } from "../contexts/AuthContext";
import { Card, Badge, Button } from "../components/ui";
import { normalizeImageUrl } from "../utils/imageUtils";

const  User = props => {
    
  
    const [bio, setBio]                     = useState();
    const [userInfo, setUserInfo]           = useState('');
    const [imageDisplay, setImageDisplay]   = useState('');
    const [year, setYear]                   = useState();
    const [venmo, setVenmo]                 = useState();
    const [interests, setInterests]         = useState([]);
    const [processed, setProcessed]         = useState(false);
    const [items, setItems]                 = useState([]);
    const [viewer, setViewer]               = useState('');
    const [viewed, setViewed]               = useState(false);
    const [loading, setLoading]             = useState(true);
    const [itemsLoading, setItemsLoading]   = useState(true);
    const { username } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const { isAuthenticated, user: authUser } = useAuth();

    // Load user info only once when component mounts or username changes
    useEffect(() => {
        let mounted = true;
        
        const getUserInfo = async () => {
            if (!mounted) return;
            
            // Only fetch if we don't have userInfo yet
            if (!userInfo && username) {
                try {
                    // Get viewer (current user) from auth context instead of API
                    if (authUser) {
                        setViewer(authUser.username);
                    } else if (isAuthenticated) {
                        // Fallback to API if auth context doesn't have user yet
                        const res = await api.get('/api/auth/user');
                        if (mounted && res.data) {
                            setViewer(res.data);
                        }
                    }
                    
                    // Get profile info for the viewed user
                    const profileInfo = await getUserProfile(username);
                    if (mounted && profileInfo) {
                        setUserInfo(profileInfo);
                        setLoading(false);
                    } else if (mounted) {
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('Error loading user info:', error);
                    if (mounted) {
                        setLoading(false);
                    }
                }
            }
        };
        
        getUserInfo();
        
        return () => {
            mounted = false;
        };
    }, [username, authUser, isAuthenticated]); // Only re-run if username or auth changes

    // Process user info when it's loaded
    useEffect(() => {
        if (userInfo && !processed) {
            processUserInfo(userInfo);
            setProcessed(true);
        }
    }, [userInfo, processed]);

    // Update views when viewer is set
    useEffect(() => {
        if (viewer && !viewed && username) {
            setViewed(true);
            updateViews(username);
        }
    }, [viewer, viewed, username]);

    function processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        setBio(bio);
        setYear(class_year);
        if(interests)setInterests(interests);
        setVenmo(venmo);
        setImageDisplay(profile_pic);

    }
    async function processMessageRequest(){
        if(viewer && socketRef.current){
            const users = [viewer, username];
            socketRef.current.emit('get-open', users);
            socketRef.current.on('message-navigate', id => {
                // Defensive: Ensure id is a string, never an object
                const chatId = typeof id === 'string' ? id : String(id);
                if(chatId && chatId !== '[object Object]' && chatId !== 'undefined'){
                    navigate(`/profile/messages/${chatId}`);
                } else {
                    console.error('Invalid chat ID received from socket:', id);
                }
            });
        }else if(!viewer){
            navigate('/login')
        }
        

    }
    
    // Initialize socket and load items when username changes
    useEffect(() => {
        let mounted = true;
        
        // Only initialize socket if authenticated
        if (typeof window !== 'undefined' && path && isAuthenticated && !socketRef.current) {
            try {
                socketRef.current = io.connect(`${path}/api/messages`, {
                    withCredentials: true,
                    transports: ['websocket', 'polling']
                });
            } catch (e) {
                console.error('Error initializing socket:', e);
            }
        }
        
        // Load items only once when username is available and items are empty
        // Allow viewing items even if not authenticated
        if (items.length === 0 && username) {
            setItemsLoading(true);
            api.get(`/api/profile/items/${username}`)
                .then(res => {
                    if (mounted) {
                        const itemsSafe = Array.isArray(res.data?.items) ? res.data.items : [];
                        setItems(itemsSafe.reverse());
                        setItemsLoading(false);
                    }
                })
                .catch(e => {
                    console.error('Error loading items:', e);
                    if (mounted) {
                        setItems([]);
                        setItemsLoading(false);
                    }
                });
        } else if (items.length > 0) {
            setItemsLoading(false);
        }
        
        // Cleanup on unmount or when auth changes
        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off('message-navigate');
                if (!isAuthenticated) {
                    // Disconnect socket if user logs out
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            }
        };
    }, [username, isAuthenticated]); // Re-run when username or auth changes
    



    const isOwnProfile = viewer === username;
    const interestsSafe = Array.isArray(interests) ? interests : [];
    const itemsSafe = Array.isArray(items) ? items : [];

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <svg 
                                className="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto mb-4" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-base text-[var(--color-muted)]">Loading profile...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return(
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Header/>
            <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Sidebar - Profile Info */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 space-y-6">
                            {/* Profile Picture */}
                            <div className="flex justify-center">
                                <div className="relative">
                                    <img
                                        className="w-48 h-48 rounded-full object-cover border-4 border-[var(--color-surface-2)] shadow-lg" 
                                        src={imageDisplay ? normalizeImageUrl(imageDisplay) : placeholder}
                                        alt={username || 'Profile'}
                                        onError={(e) => {
                                            e.target.src = placeholder;
                                        }}
                                    />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="space-y-4">
                                {/* Graduating Class */}
                                {year && (
                                    <div className="space-y-1">
                                        <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                                            Graduating Class
                                        </div>
                                        <div className="text-lg font-medium text-[var(--color-text)]">
                                            {year}
                                        </div>
                                    </div>
                                )}

                                {/* Interests */}
                                {interestsSafe.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                                            Interests
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {interestsSafe.map((interest, index) => (
                                                <Badge key={index} variant="default" className="text-sm">
                                                    {interest}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Venmo */}
                                {venmo && (
                                    <div className="space-y-1">
                                        <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                                            Venmo
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img 
                                                className="w-6 h-4 object-contain" 
                                                src={require('../assets/vimeo.png')}
                                                alt="Venmo"
                                            />
                                            <span className="text-lg font-semibold text-[var(--color-text)]">
                                                {venmo}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bio */}
                            {bio && (
                                <div className="pt-4 border-t border-[var(--color-border)]">
                                    <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-2">
                                        About
                                    </div>
                                    <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                                        {bio}
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column - Username, Actions, and Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)]">
                                        {username}
                                    </h1>
                                    {/* Verified badge or other indicator could go here */}
                                </div>
                                {itemsSafe.length > 0 && (
                                    <p className="text-[var(--color-muted)]">
                                        {itemsSafe.length} {itemsSafe.length === 1 ? 'item' : 'items'} listed
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {!isOwnProfile && viewer && (
                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        className="px-6 py-2.5"
                                    >
                                        Follow
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => processMessageRequest()}
                                        className="px-6 py-2.5"
                                    >
                                        Message
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Items Section */}
                        <div>
                            {itemsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="text-center">
                                        <svg 
                                            className="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto mb-4" 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            fill="none" 
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-base text-[var(--color-muted)]">Loading items...</p>
                                    </div>
                                </div>
                            ) : (
                                <StoreItems
                                    data={itemsSafe}
                                    user={viewer}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default User;
    

    

