
import Header from '../components/Header';
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserChats, getUserProfile, getUserImage } from "../api/ProfileAPI";
import api from "../api/http";
import placeholder from '../assets/placeholder_user_sm.png'
import { Link, useLocation } from 'react-router-dom';
import ScrollableFeed from 'react-scrollable-feed'
import FileViewer from 'react-file-viewer';
import io from 'socket.io-client';
import { path } from '../api/ProfileAPI';
import { normalizeImageUrl, getUserInitial } from "../utils/imageUtils";
import benFranklinThoughtBubble from '../assets/benjamin-franklin-thought-bubble.png';
import { useAuth } from '../contexts/AuthContext';
import { useUnread } from '../contexts/UnreadContext';
import MessagingBlockedModal from '../components/MessagingBlockedModal';
import { requireAuthForMessaging } from '../utils/messagingGuard';
import { 
    getGuestSessionId, 
    getGuestMessageCount, 
    incrementGuestMessageCount, 
    hasReachedGuestLimit,
    resetGuestMessageCount,
    getRemainingGuestMessages
} from '../utils/guestSession';
import AuthRequiredModal from '../components/AuthRequiredModal';

const Messages = props => {
    // Helper to normalize conversation ID (handle both _id and id)
    const getConvoId = (c) => c?._id || c?.id;
    
    const { isAuthenticated, user: authUser, demoLogin } = useAuth();
    const {id: conversationIdParam} = useParams();
    // Normalize route param ID
    const routeConvoId = getConvoId({ id: conversationIdParam });
    
    console.log('[MESSAGES] route convoId param:', routeConvoId);

    const location = useLocation();
    const propsChat = location.state;
    const [chats, setChats] = useState(propsChat || []);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [user, setUser] = useState('');
    const [messages, setMessages] = useState([]);
    
    // Log active conversation ID
    console.log('[MESSAGES] activeConversationId state:', activeConversationId);
    
    // Log conversations loaded
    useEffect(() => {
        if (Array.isArray(chats) && chats.length > 0) {
            console.log('[MESSAGES] conversations loaded ids:', chats.map(c => getConvoId(c)));
        }
    }, [chats]);
    const [text, setText]           = useState('');
    const [attachment, setAttachment] = useState('');
    const [attachmentDisplay , setAttachmentDisplay]    = useState();
    const [receiver , setReceiver]       = useState('');
    const [users, setUsers]             = useState([])
    const [sender, setSender]           = useState('');
    const [chatImages, setChatImages] = useState('');
    const [stateId , setStateId]  = useState(null);
    const [menuOpen, setMenuOpen] = useState(true)
    const inputRef = useRef()
    const navigate = useNavigate();
    const [processed, setProcessed] = useState(false)
    const [allowed, setAllowed] = useState(false)
    const [joined, setJoined] = useState(false);
    const socketRef = useRef(null);
    // Managed unreadCounts state - single source of truth for unread indicators
    const { unreadCounts, setUnreadCounts } = useUnread();
    // Guard to prevent ensure-concierge-only from running multiple times
    const didEnsureConciergeRef = useRef(false);
    // Draft thread state (for demo users)
    const [draftTo, setDraftTo] = useState(null);
    const [draftReceiver, setDraftReceiver] = useState(null);
    // Socket connection state
    const [socketConnected, setSocketConnected] = useState(false);
    // Track failed avatar loads to persist fallback state
    const [failedAvatars, setFailedAvatars] = useState(new Set());
    // Guest session state
    const [isGuest, setIsGuest] = useState(false);
    const [guestMessageCount, setGuestMessageCount] = useState(0);
    const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
    const [showMessagingBlockedModal, setShowMessagingBlockedModal] = useState(false);
    
    // Format timestamp helper - defined early to avoid hoisting issues
    const formatTimestamp = (date) => {
        if (!date) return '';
        try {
            const msgDate = new Date(date);
            const now = new Date();
            const diffMs = now - msgDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };
    
    // Group consecutive messages by sender - defined early to avoid hoisting issues
    const groupMessages = (messages) => {
        if (!Array.isArray(messages) || messages.length === 0) return [];
        
        const grouped = [];
        let currentGroup = null;
        
        messages.forEach((msg) => {
            if (!msg || msg === 'string to stop infinite loop') return;
            
            try {
                const msgTimestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
                const isSameSender = currentGroup && currentGroup.sender === msg.sender;
                
                let timeDiff = Infinity;
                if (currentGroup && currentGroup.messages.length > 0) {
                    const lastMsgTimestamp = currentGroup.messages[currentGroup.messages.length - 1].timestamp 
                        ? new Date(currentGroup.messages[currentGroup.messages.length - 1].timestamp)
                        : new Date();
                    timeDiff = Math.abs(msgTimestamp - lastMsgTimestamp);
                }
                
                const shouldGroup = isSameSender && timeDiff < 300000; // 5 minutes
                
                if (shouldGroup && currentGroup) {
                    currentGroup.messages.push(msg);
                } else {
                    currentGroup = {
                        sender: msg.sender,
                        messages: [msg],
                        timestamp: msg.timestamp || new Date().toISOString()
                    };
                    grouped.push(currentGroup);
                }
            } catch (err) {
                // Skip invalid messages
                console.error('Error grouping message:', err);
            }
        });
        
        return grouped;
    };
    
    // Helper to render profile picture with fallback (persists failed state)
    const renderProfilePic = (userObj, username, size = 'h-10 w-10') => {
        const displayName = username || userObj?.username || '';
        const initial = getUserInitial(displayName);
        const avatarKey = displayName;
        const hasFailed = failedAvatars.has(avatarKey);
        // Support both profile_pic and profilePic/avatar fallback
        const picUrl = !hasFailed ? normalizeImageUrl(userObj?.profile_pic || userObj?.profilePic || userObj?.avatar) : null;
        
        if (picUrl && !hasFailed) {
            return (
                <>
                    <img 
                        src={picUrl} 
                        alt={displayName}
                        className={`rounded-full ${size} bg-gray-200 object-cover`}
                        onError={(e) => {
                            // Mark as failed and show fallback immediately
                            setFailedAvatars(prev => new Set([...prev, avatarKey]));
                            e.target.style.display = 'none';
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = 'flex';
                        }}
                    />
                    <div 
                        className={`rounded-full ${size} bg-gray-500 flex items-center justify-center text-white font-semibold text-sm`}
                        style={{ display: 'none' }}
                    >
                        {initial}
                    </div>
                </>
            );
        }
        // Show initial circle as fallback (always shown if failed or no pic)
        return (
            <div className={`rounded-full ${size} bg-gray-500 flex items-center justify-center text-white font-semibold text-sm`}>
                {initial}
            </div>
        );
    }; 


    async function checkAllowed(){
        const selectedId = routeConvoId || activeConversationId;
        if(!processed && selectedId){
            if(user){
                const chts = await getUserChats(user);
                chts.map( cht => {
                    const chtId = getConvoId(cht);
                    if(chtId === selectedId){
                        setAllowed(true);
                    }
                })
                
                setProcessed(true)
            } else if (!isAuthenticated && selectedId) {
                // Allow guests to access if they have a chat ID
                // Guest sessions are handled differently
                setIsGuest(true);
                setAllowed(true); // Allow guest to view/use messaging UI
                setProcessed(true);
                setGuestMessageCount(getGuestMessageCount());
            }
        }
    }
    
    // Check auth status and set guest mode
    useEffect(() => {
        if (!isAuthenticated && !user) {
            setIsGuest(true);
            setGuestMessageCount(getGuestMessageCount());
        } else {
            setIsGuest(false);
            if (isAuthenticated) {
                resetGuestMessageCount(); // Clear guest data after auth
            }
        }
    }, [isAuthenticated, user]);
    
    // Clear chat state when user logs out (especially for demo user)
    useEffect(() => {
        if (!isAuthenticated && (user || chats.length > 0 || messages.length > 0)) {
            // User logged out - clear all chat state
            setChats([]);
            setMessages([]);
            setReceiver('');
            setSender('');
            setUsers([]);
            setText('');
            setAttachment('');
            setAttachmentDisplay('');
            setAllowed(false);
            setProcessed(false);
            
            // Disconnect socket if connected
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }
    }, [isAuthenticated]);
    
    // Check for draftTo or startConversation query params on mount
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const draftToParam = searchParams.get('draftTo');
        const startConversationParam = searchParams.get('startConversation');
        
        if (draftToParam && authUser) {
            const isDemo = authUser?.username === 'demo' || authUser?.isDemo === true;
            if (isDemo) {
                setDraftTo(draftToParam);
                // Fetch receiver profile for draft thread
                getUserProfile(draftToParam).then(profile => {
                    setDraftReceiver(profile);
                    setReceiver(profile);
                    setUsers([authUser.username, draftToParam]);
                }).catch(err => {
                    console.error('Error loading draft receiver:', err);
                });
            }
        } else if (startConversationParam && authUser && socketRef.current) {
            // Real user: start conversation via socket (non-blocking)
            const users = [authUser.username, startConversationParam];
            socketRef.current.emit('get-open', users);
            socketRef.current.once('message-navigate', id => {
                const chatId = typeof id === 'string' ? id : String(id);
                if (chatId && chatId !== '[object Object]' && chatId !== 'undefined') {
                    // Remove query param and navigate to conversation
                    navigate(`/profile/messages/${chatId}`, { replace: true });
                }
            });
            // Clean up query param immediately
            navigate('/profile/messages', { replace: false });
        }
    }, [location.search, authUser]);
    
    checkAllowed();



    async function setUp(){
       
        if(!user){
            const res = await api.get('/api/auth/user');
            setUser(res.data)
        }
        if(chats.length === 0 && user ){
            setChats(  await getUserChats(user));
        } 
    

        // Fetch receiver and sender profiles when we have users array and current user
        // Skip if concierge (already handled in useEffect above)
        if(Array.isArray(users) && users.length > 0 && user && allowed){
            const isConcierge = users.includes('franklindesk');
            
            // Skip receiver fetch for concierge (already set in useEffect)
            if (!isConcierge) {
                // Find the other user (not the current user)
                const otherUser = users.find(usr => usr !== user);
                // Fetch receiver profile if we don't have it or if it's missing profile data
                if(otherUser && (!receiver || !receiver.username || receiver.username !== otherUser || (!receiver.profile_pic && !receiver.profilePic && !receiver.avatar))){
                    try {
                        const receiverProfile = await getUserProfile(otherUser);
                        setReceiver(receiverProfile);
                    } catch (error) {
                        console.error('Error fetching receiver profile:', error);
                    }
                }
            }
            
            // Set sender profile if not set or missing profile data
            if(user && (!sender || !sender.username || (!sender.profile_pic && !sender.profilePic && !sender.avatar))){
                try {
                    const senderProfile = await getUserProfile(user);
                    setSender(senderProfile);
                } catch (error) {
                    console.error('Error fetching sender profile:', error);
                }
            }
        }
        
    }
    
    useEffect(() => {
        setUp();
    }, [users, user, allowed, receiver, sender]);
    
    // Ensure concierge-only conversation exists for demo users on mount ONLY
    // This deletes any old conversations and ensures only concierge thread exists
    // Use ref guard to prevent re-running on route changes or state updates
    useEffect(() => {
        // Only run once on mount, not on every route change
        if (didEnsureConciergeRef.current) {
            return;
        }
        
        const ensureConciergeOnlyForDemo = async () => {
            const isDemoUser = authUser?.username === 'demo' || authUser?.isDemo === true;
            if (isDemoUser && isAuthenticated) {
                didEnsureConciergeRef.current = true; // Set guard immediately to prevent re-runs
                try {
                    // Call ensure-concierge-only endpoint (deletes all, then creates concierge)
                    await api.post('/api/auth/demo/ensure-concierge-only', {}, { withCredentials: true });
                    
                    // Refresh chats after ensuring concierge-only
                    const currentUser = user || authUser?.username;
                    if (currentUser) {
                        const updatedChats = await getUserChats(currentUser);
                        if (Array.isArray(updatedChats)) {
                            console.log('[MESSAGES] Chats updated after ensure:', updatedChats.map(c => getConvoId(c)));
                            setChats(updatedChats);
                            
                            // Auto-select concierge conversation if none selected
                            const currentSelectedId = routeConvoId || activeConversationId;
                            if (!currentSelectedId) {
                                const conciergeChat = updatedChats.find(c => {
                                    const users = Array.isArray(c.users) ? c.users : [];
                                    return users.includes('franklindesk');
                                });
                                if (conciergeChat) {
                                    const conciergeId = getConvoId(conciergeChat);
                                    if (conciergeId) {
                                        console.log('[MESSAGES] Auto-selecting concierge conversation:', conciergeId);
                                        setActiveConversationId(conciergeId);
                                        // Navigate to concierge conversation
                                        navigate(`/profile/messages/${conciergeId}`, { replace: false });
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error ensuring concierge only:', error);
                    // If ensure fails, still try to load chats
                    if (user) {
                        try {
                            const updatedChats = await getUserChats(user);
                            if (Array.isArray(updatedChats)) {
                                setChats(updatedChats);
                            }
                        } catch (e) {
                            console.error('Error loading chats:', e);
                        }
                    }
                }
            }
        };
        
        ensureConciergeOnlyForDemo();
    }, []); // Empty dependency array - run ONLY on mount
    
    // Initialize unreadCounts from sender.unread, filtering out opened concierge for demo users
    useEffect(() => {
        if (!sender || !Array.isArray(sender.unread)) {
            setUnreadCounts([]);
            return;
        }
        
        const serverUnread = sender.unread;
        
        // For demo users, filter out concierge if it's been opened
        const isDemoUser = authUser?.username === 'demo' || authUser?.isDemo === true;
        if (isDemoUser) {
            const sessionId = sessionStorage.getItem('demoSessionId');
            if (sessionId && localStorage.getItem(`demoConciergeOpened:${sessionId}`) === '1') {
                // Find concierge conversation ID
                const conciergeChat = Array.isArray(chats) ? chats.find(c => {
                    const users = Array.isArray(c.users) ? c.users : [];
                    return users.includes('franklindesk');
                }) : null;
                
                if (conciergeChat) {
                    const conciergeId = getConvoId(conciergeChat);
                    if (conciergeId) {
                        // Filter out concierge from unread counts
                        const filtered = serverUnread.filter(id => {
                            const idStr = typeof id === 'string' ? id : String(id);
                            return idStr !== conciergeId;
                        });
                        setUnreadCounts(filtered);
                        return;
                    }
                }
            }
        }
        
        // Default: use server unread as-is
        setUnreadCounts(serverUnread);
    }, [sender?.unread, chats, authUser]);
    
    // Mark conversation as read when it becomes selected
    useEffect(() => {
        const selectedId = routeConvoId || activeConversationId;
        if (!selectedId || unreadCounts.length === 0) {
            return;
        }
        
        // Check if this conversation is in unreadCounts
        const isUnread = unreadCounts.some(id => {
            const idStr = typeof id === 'string' ? id : String(id);
            const selectedIdStr = typeof selectedId === 'string' ? selectedId : String(selectedId);
            return idStr === selectedIdStr;
        });
        
        if (isUnread) {
            console.log('[MESSAGES] Marking conversation as read:', selectedId);
            
            // Remove from unreadCounts immediately
            setUnreadCounts(prev => {
                const filtered = prev.filter(id => {
                    const idStr = typeof id === 'string' ? id : String(id);
                    const selectedIdStr = typeof selectedId === 'string' ? selectedId : String(selectedId);
                    return idStr !== selectedIdStr;
                });
                return filtered;
            });
            
            // Sync with server if socket connected
            if (socketRef.current && socketConnected && user) {
                socketRef.current.emit('clear-unread', { id: selectedId, username: user || authUser?.username });
            }
            
            // For demo concierge, persist opened state
            const selectedConversation = Array.isArray(chats) ? chats.find(c => getConvoId(c) === selectedId) : null;
            if (selectedConversation) {
                const selectedUsers = Array.isArray(selectedConversation.users) ? selectedConversation.users : [];
                const isConcierge = selectedUsers.includes('franklindesk');
                const isDemoUser = authUser?.username === 'demo' || authUser?.isDemo === true;
                
                if (isConcierge && isDemoUser) {
                    let sessionId = sessionStorage.getItem('demoSessionId');
                    if (!sessionId) {
                        sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                            const r = Math.random() * 16 | 0;
                            const v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                        sessionStorage.setItem('demoSessionId', sessionId);
                    }
                    localStorage.setItem(`demoConciergeOpened:${sessionId}`, '1');
                }
            }
            
            // Trigger header update
            if (socketRef.current) {
                socketRef.current.emit('unread');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeConvoId, activeConversationId]); // Run when selection changes (unreadCounts excluded to avoid loops)
    
    // Sync users state from selected conversation and set receiver for concierge
    useEffect(() => {
        const selectedId = routeConvoId || activeConversationId;
        const selectedConversation = Array.isArray(chats) ? chats.find(c => getConvoId(c) === selectedId) : null;
        
        if (!selectedConversation) {
            return;
        }
        
        const selectedUsers = Array.isArray(selectedConversation.users) ? selectedConversation.users : [];
        
        // Sync users state from selected conversation
        if (selectedUsers.length > 0) {
            setUsers(selectedUsers);
        }
        
        // Special case for concierge: set receiver immediately
        const isConcierge = selectedUsers.includes('franklindesk');
        if (isConcierge) {
            // Set lightweight receiver object immediately for concierge
            setReceiver({
                username: 'franklindesk',
                name: 'Franklin Desk',
                profile_pic: '/ben-franklin-demo-user.png',
                bio: 'Your PennThrift concierge'
            });
            return; // Don't fetch profile for concierge
        }
        
        // For non-concierge conversations, fetch receiver profile if needed
        if (selectedUsers.length > 0 && user) {
            const otherUser = selectedUsers.find(usr => usr !== user);
            if (otherUser && (!receiver || receiver.username !== otherUser)) {
                // Fetch receiver profile
                getUserProfile(otherUser).then(profile => {
                    setReceiver(profile);
                }).catch(error => {
                    console.error('Error fetching receiver profile:', error);
                });
            }
        }
    }, [routeConvoId, activeConversationId, chats, user, authUser]);
    
    // Auto-select first conversation if none selected and conversations exist
    useEffect(() => {
        const selectedId = routeConvoId || activeConversationId;
        if (!selectedId && Array.isArray(chats) && chats.length > 0 && user && !processed) {
            const firstChat = chats[0];
            const firstChatId = getConvoId(firstChat);
            if (firstChatId) {
                console.log('[MESSAGES] Auto-selecting first conversation:', firstChatId);
                navigate(`/profile/messages/${firstChatId}`, { replace: true });
                setActiveConversationId(firstChatId);
            }
        }
    }, [chats, user, routeConvoId, activeConversationId, processed, navigate]);
    
    async function sendMessage(userParam, message, attachment){
        // Get current conversation ID
        const currentConversationId = routeConvoId || activeConversationId;
        
        // Block demo users from sending messages (including draft threads)
        if (authUser && !requireAuthForMessaging(authUser)) {
            // Check if this is a draft thread (demo user trying to message real user)
            if (draftTo || (receiver && receiver.username !== 'franklindesk')) {
                setShowMessagingBlockedModal(true);
                return;
            }
        }
        
        // Handle guest sessions
        if (isGuest && !isAuthenticated) {
            // Check guest message limit
            if (hasReachedGuestLimit()) {
                setShowGuestAuthModal(true);
                return;
            }
            
            // Increment guest message count
            const newCount = incrementGuestMessageCount();
            setGuestMessageCount(newCount);
            
            // Use guest session ID as sender
            const guestSessionId = getGuestSessionId();
            userParam = guestSessionId;
        }
        
        // For draft threads, allow sending attempt (will be blocked by demo check above)
        const canSend = (allowed && receiver && socketRef.current) || (draftTo && draftReceiver);
        
        if(canSend){
            if(attachment){
                var formData = new FormData();
                formData.append("file", attachment);
                api.post('/api/file/upload', formData,{
                    headers: {
                    'Content-Type': 'multipart/form-data'
                    }
                }).then( async res => {
                    // Fix: Extract URL from response object, normalize to absolute URL
                    // Upload endpoint returns: {path: '/api/file/...', url: 'https://...', filename: '...'}
                    let attachmentUrl = null;
                    if(res.data) {
                        if(typeof res.data === 'string') {
                            attachmentUrl = res.data;
                        } else if(res.data.url) {
                            attachmentUrl = res.data.url;
                        } else if(res.data.path) {
                            attachmentUrl = res.data.path;
                        }
                    }
                    
                    // Normalize to absolute URL if we have a string
                    const normalizedUrl = attachmentUrl && typeof attachmentUrl === 'string'
                        ? normalizeImageUrl(attachmentUrl) 
                        : null;
                    
                    if(!normalizedUrl) {
                        console.error('Failed to extract attachment URL from upload response:', res.data);
                    }
                    
                    const data = { 
                        sender: userParam, 
                        message: message, 
                        attachment: normalizedUrl || '', 
                        id: currentConversationId, 
                        receiver: receiver.username,
                        isGuest: isGuest && !isAuthenticated // Flag for server to handle guest messages
                    };
                    await socketRef.current.emit('send-message', data );
                    setAttachment('');
                    setAttachmentDisplay('');
    
                })
            }else{
                const data = { 
                    sender: userParam, 
                    message: message, 
                    attachment: attachment, 
                    id: currentConversationId,
                    receiver: receiver.username,
                    isGuest: isGuest && !isAuthenticated // Flag for server to handle guest messages
                };
                await socketRef.current.emit('send-message', data );
            }
            setText('');
        }
    }
    
    const handleGuestAuthModalSuccess = async () => {
        setShowGuestAuthModal(false);
        // After auth, refresh user state
        try {
            const res = await api.get('/api/auth/user');
            setUser(res.data);
            // Retry sending the message if there was one pending
        } catch (error) {
            console.error('Error refreshing user after auth:', error);
        }
    };

 
    // Helper to check if URL is an image
    const isImageUrl = (url) => {
        if(!url || typeof url !== 'string') return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const urlLower = url.toLowerCase();
        return imageExtensions.some(ext => urlLower.includes(`.${ext}`)) || 
               urlLower.includes('image/') ||
               urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|#|$)/i);
    };
 
    function getMessageType(user, text, attachment, msgSender, image  ){
        // Normalize attachment URL to absolute URL
        const normalizeAttachmentUrl = (attachmentData) => {
            if(!attachmentData) return null;
            
            // Handle different attachment formats
            let url = null;
            if(typeof attachmentData === 'string') {
                url = attachmentData;
            } else if(attachmentData && typeof attachmentData === 'object') {
                // Handle object with url or path property
                url = attachmentData.url || attachmentData.path;
                // If still no url and it's an object, try toString (defensive)
                if(!url && attachmentData.toString && attachmentData.toString() !== '[object Object]') {
                    url = attachmentData.toString();
                }
            }
            
            if(!url || typeof url !== 'string') return null;
            
            // Normalize to absolute URL
            return normalizeImageUrl(url);
        };
        
        const attachmentUrl = normalizeAttachmentUrl(attachment);
        const isImage = attachmentUrl && isImageUrl(attachmentUrl);
        
        // Render attachment based on type
        const renderAttachment = () => {
            if(!attachmentUrl) return null;
            
            if(isImage) {
                // Render image inline
                return (
                    <div className='my-2'>
                        <img 
                            src={attachmentUrl}
                            alt="Attachment"
                            className='max-w-[280px] md:max-w-[360px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity'
                            onClick={() => window.open(attachmentUrl, '_blank', 'noopener,noreferrer')}
                            onError={(e) => {
                                // Fallback if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling?.style?.removeProperty('display');
                            }}
                        />
                        <a 
                            href={attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className='hidden text-blue-600 hover:underline text-sm'
                            onClick={(e) => {
                                e.preventDefault();
                                window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
                            }}
                        >
                            📎 View Image
                        </a>
                    </div>
                );
            } else {
                // Non-image: show clickable link
                return (
                    <div className='my-2'>
                        <a 
                            href={attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className='text-blue-600 hover:underline inline-flex items-center gap-1'
                            onClick={(e) => {
                                e.preventDefault();
                                window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
                            }}
                        >
                            📎 View Attachment
                        </a>
                    </div>
                );
            }
        };
        
        if(msgSender == user && sender){
            return(
                <div className='flex justify-end gap-2 mb-1 group'>
                    <div style={{overflowWrap:'anywhere'}} className='px-4 py-2 max-w-[70%] flex-col flex w-fit rounded-2xl bg-blue-500 text-white'>
                        {renderAttachment()}
                        {text && <div className='text-sm'>{text}</div>}
                            </div>
                    <div className='flex-shrink-0'>
                        {renderProfilePic(sender, sender?.username)}
                    </div>
                </div>
            )
            
        }else if(msgSender != user && sender && msgSender){
            return(
                <div className='flex gap-2 mb-1 group'>
                    <div className='flex-shrink-0'>
                        {renderProfilePic(receiver, receiver?.username)}
                            </div>
                    <div style={{overflowWrap:'anywhere'}} className='px-4 py-2 max-w-[70%] flex-col flex rounded-2xl bg-gray-200 text-gray-900'>
                        {renderAttachment()}
                        {text && <div className='text-sm'>{text}</div>}
                    </div>
                </div>            
            )

        }
        return null;
    }

    
    
    async function updateChats(){
        const res = await getUserChats(user)
        if(res != chats && res){
            setChats(  res);
        }
    }

    function loadMessages(chatId){
        // Defensive: Ensure chatId is a valid string
        const validChatId = chatId && typeof chatId === 'string' && chatId !== '[object Object]' && chatId !== 'undefined' ? chatId : null;
        if(!validChatId) return;
        
        if(socketRef.current && socketConnected){
            console.log('[MESSAGES] Loading messages for conversation:', validChatId);
            // Join room first, then load messages
            socketRef.current.emit('join-room', validChatId);
            socketRef.current.emit('load', validChatId);
        } else {
            // Socket not connected yet, queue it
            console.log('[MESSAGES] Socket not connected, queueing conversation:', validChatId);
            pendingConversationIdRef.current = validChatId;
        }
    }
    function refresh(conversationId){
        if (!conversationId) return;
        setMessages([])
        setReceiver('')
        // loadMessages will handle join-room + load
        loadMessages(conversationId);
        // Removed window.location.reload() - causes full page refresh
        // State updates above are sufficient to refresh the UI
    }

    // Track pending conversation to load when socket connects
    const pendingConversationIdRef = useRef(null);
        
    useEffect(() => {
        // Initialize socket inside useEffect
        if (typeof window !== 'undefined' && path && !socketRef.current) {
            try {
                // Use proper socket.io URL (base URL, socket.io handles /socket.io path)
                const socketUrl = path.replace(/\/$/, ''); // Remove trailing slash
                
                // Connect to /api/messages namespace explicitly
                socketRef.current = io(`${socketUrl}/api/messages`, {
                    path: '/socket.io',
                    withCredentials: true,
                    transports: ['websocket', 'polling'], // Allow fallback to polling
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000
                });
                
                console.log('[MESSAGES] Connecting to socket namespace:', `${socketUrl}/api/messages`);
                
                // Add connection event handlers
                socketRef.current.on('connect', () => {
                    console.log('✅ Socket.io connected to /api/messages namespace');
                    setSocketConnected(true);
                    
                    // If there's a pending conversation, load it now
                    if (pendingConversationIdRef.current) {
                        const pendingId = pendingConversationIdRef.current;
                        console.log('[MESSAGES] Loading pending conversation after socket connect:', pendingId);
                        socketRef.current.emit('join-room', pendingId);
                        socketRef.current.emit('load', pendingId);
                        pendingConversationIdRef.current = null;
                    }
                });
                
                socketRef.current.on('disconnect', (reason) => {
                    console.log('⚠️ Socket.io disconnected:', reason);
                    setSocketConnected(false);
                });
                
                socketRef.current.on('connect_error', (error) => {
                    console.error('❌ Socket.io connection error:', error);
                    setSocketConnected(false);
                });
            } catch (e) {
                console.error('Error initializing socket:', e);
            }
        }
        
        // Derive selected conversation from route or active state
        const selectedId = routeConvoId || activeConversationId;
        const selectedConversation = Array.isArray(chats) ? chats.find(c => getConvoId(c) === selectedId) : null;
        
        console.log('[MESSAGES] selected conversation:', selectedConversation);
        console.log('[MESSAGES] selectedId:', selectedId);
        
        if(selectedId && selectedConversation){
            console.log('[MESSAGES] Loading conversation:', selectedId);
            // Only refresh if conversation ID actually changed
            if(stateId !== selectedId) {
                if(stateId) {
                    // Conversation changed - refresh messages
                    setStateId(selectedId);
                    refresh(selectedId);
                } else {
                    // First load - just set state
                    setStateId(selectedId);
                    // Load messages for first load
                    loadMessages(selectedId);
                }
            } else if (stateId === selectedId && socketRef.current && socketConnected) {
                // Same conversation but ensure messages are loaded if socket just connected
                loadMessages(selectedId);
            }
        } else if(routeConvoId && !selectedConversation) {
            console.warn('[MESSAGES] Route ID exists but conversation not found:', routeConvoId);
            // Don't redirect - might be loading
        }
        
        if(socketRef.current){
            // Remove old listener to prevent duplicates
            socketRef.current.off('allMessages');
            
            socketRef.current.on('allMessages', data => {
                console.log('[MESSAGES] Received allMessages:', data);
                if(data && data.messages && data.messages.length > 0){
                    // Add timestamps to messages if missing
                    const messagesWithTimestamps = data.messages.map((msg, idx) => ({
                        ...msg,
                        timestamp: msg.timestamp || new Date(Date.now() - (data.messages.length - idx) * 60000).toISOString()
                    }));
                    console.log('[MESSAGES] Setting messages:', messagesWithTimestamps.length);
                    setMessages(messagesWithTimestamps);
                }else{
                    console.log('[MESSAGES] No messages in response, setting empty state');
                    setMessages(['string to stop infinite loop'])
                }
                if(data && data.users){
                    setUsers(data.users)
                    
                    // Check if this is the concierge conversation and mark as opened
                    const isDemoUser = authUser?.username === 'demo' || authUser?.isDemo === true;
                    if (isDemoUser && Array.isArray(data.users) && data.users.includes('franklindesk')) {
                        const sessionId = sessionStorage.getItem('demoSessionId');
                        if (sessionId) {
                            localStorage.setItem(`demoConciergeOpened:${sessionId}`, '1');
                            // Trigger header update by emitting unread update
                            if (socketRef.current) {
                                socketRef.current.emit('unread');
                            }
                        }
                    }
                }
            })
            
            const selectedId = routeConvoId || activeConversationId;
            if(selectedId && user && sender && Array.isArray(sender.unread) && sender.unread.includes(selectedId)){
                socketRef.current.emit('clear-unread',{id:selectedId, username:user})
            }
            
            if(!joined && selectedId){
                socketRef.current.emit('join-room', selectedId);
                setJoined(true)
            }
            
            socketRef.current.on('receive-message', id =>{
                if(socketRef.current){
                    socketRef.current.emit('load', id);
                }
                updateChats()
            })
            
            // Listen for message-blocked events (demo user trying to message real user)
            socketRef.current.on('message-blocked', (data) => {
                if (data?.reason === 'demo_user_blocked') {
                    setShowMessagingBlockedModal(true);
                }
            })
        }
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.off('allMessages');
                socketRef.current.off('receive-message');
                socketRef.current.off('message-blocked');
            }
        };
        
    },[routeConvoId, activeConversationId, messages,receiver, processed, allowed, chats, user, users, attachmentDisplay, attachment, sender, joined])
    
    function handleClick(){
        document.getElementById('selectFile').click()
    }
    function processAttachment(image){
        setAttachment(image);
        setAttachmentDisplay(URL.createObjectURL(image));

    }
    function getFileType(src, url){
        try{
            if(!src) return null;
            
            if(!url && src){
                var parts = src.split('/')
                const filename = parts[parts.length - 1];
                if(!filename || !filename.includes('.')) return null;
                return filename.split('.').pop().trim();
            }else{
                const cleanPath = src.split(/[#?]/)[0];
                if(!cleanPath || !cleanPath.includes('.')) return null;
                return cleanPath.split('.').pop().trim();
            }
        }catch{
            return null;
        }
    }

    function getMenuIcon(open){
        if(open){
            return require('../assets/close.png')
        }else{
            return require('../assets/menu.png')
        }

    }

    const groupedMessages = groupMessages(messages);
    const otherUser = users.find(usr => usr !== user);
    // unreadCounts is now managed state (defined above)

    return(
        <div className="h-screen flex flex-col bg-[var(--color-bg)]">
            <Header/>
            <AuthRequiredModal
                isOpen={showGuestAuthModal}
                onClose={() => setShowGuestAuthModal(false)}
                onSuccess={handleGuestAuthModalSuccess}
                title="Continue the conversation?"
                body="Create an account to receive replies and send unlimited messages."
            />
            <MessagingBlockedModal 
                isOpen={showMessagingBlockedModal}
                onClose={() => setShowMessagingBlockedModal(false)}
            />
            {/* Socket connection status banner */}
            {socketRef.current && !socketConnected && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Chat is reconnecting...</span>
                    </div>
                </div>
            )}
            <div className="flex flex-1 overflow-hidden">
                {/* Recents Sidebar - Modern Inbox */}
                <div className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${ menuOpen ? 'w-[300px]' : 'w-0'} ${!menuOpen && 'hidden md:flex md:w-14'}`}>
                    {/* Sidebar Header */}
                    <div className='flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white'>
                        {menuOpen && (
                            <h2 className='text-lg font-semibold text-gray-900'>Messages</h2>
                        )}
                        <button 
                            onClick={() => setMenuOpen(!menuOpen)}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            aria-label={menuOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            <img 
                                src={getMenuIcon(menuOpen)} 
                                alt="Toggle menu"
                                className='h-5 w-5'
                            />
                        </button>
                    </div>
                    
                    {/* Conversations List */}
                    {menuOpen && (
                        <div className='flex-1 overflow-y-auto'>
                            {Array.isArray(chats) && chats.length > 0 ? (
                                chats.map( chat => {
                                    // Normalize conversation ID
                                    const chatId = getConvoId(chat);
                                    if(!chatId) {
                                        console.warn('[MESSAGES] Invalid chat ID:', chat);
                                        return null;
                                    }
                                    
                                    // Find other user in chat (handle concierge thread)
                                    const chatUsers = Array.isArray(chat.users) ? chat.users : [];
                                    const currentUsername = user || authUser?.username || '';
                                    const otherUserInChat = chatUsers.find(usr => usr !== currentUsername) || null;
                                    
                                    // Allow concierge thread even if otherUserInChat is null (for demo users)
                                    const isConciergeThread = chatUsers.includes('franklindesk');
                                    if (!otherUserInChat && !isConciergeThread) {
                                        console.warn('No other user found in chat:', chat);
                                        return null;
                                    }
                                    
                                    // Use franklindesk as display name for concierge thread
                                    const displayUser = isConciergeThread ? 'franklindesk' : otherUserInChat;
                                    
                                    let lastMessage = '';
                                    let lastMessageTime = null;
                                    try {
                                                    const messagesSafe = Array.isArray(chat.messages) ? chat.messages : [];
                                        if (messagesSafe.length > 0) {
                                            const lastMsg = messagesSafe[messagesSafe.length - 1];
                                            lastMessage = lastMsg?.message || '';
                                            lastMessageTime = lastMsg?.timestamp || chat.updatedAt || null;
                                        }
                                    } catch {
                                        lastMessage = '';
                                    }
                                    
                                    const currentRouteId = routeConvoId || activeConversationId;
                                    const isSelected = chatId === currentRouteId;
                                    const hasUnread = Array.isArray(unreadCounts) && unreadCounts.includes(chatId);
                                    const avatarKey = `sidebar-${displayUser}`;
                                    const hasFailed = failedAvatars.has(avatarKey);
                                    
                                    return(
                                        <button
                                            key={chatId}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log('[MESSAGES] click row', chat, 'id:', chatId);
                                                
                                                // Don't navigate if already selected
                                                const currentRouteId = routeConvoId || activeConversationId;
                                                if (chatId === currentRouteId) {
                                                    console.log('[MESSAGES] Conversation already selected:', chatId);
                                                    setActiveConversationId(chatId);
                                                    return;
                                                }
                                                
                                                // Navigate to conversation
                                                // Note: Unread clearing is handled by the useEffect that watches selectedId
                                                console.log('[MESSAGES] Navigating to conversation:', chatId);
                                                navigate(`/profile/messages/${chatId}`, { replace: false });
                                                setActiveConversationId(chatId);
                                            }}
                                            className={`w-full text-left block hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                        >
                                            <div className='flex items-center gap-3 px-4 py-3'>
                                                {/* Avatar */}
                                                <div className='flex-shrink-0 relative'>
                                                    {chat.image && !hasFailed && normalizeImageUrl(chat.image) ? (
                                                        <>
                                                            <img 
                                                                src={normalizeImageUrl(chat.image)} 
                                                                alt={displayUser}
                                                                className='rounded-full h-12 w-12 object-cover'
                                                                onError={(e) => {
                                                                    setFailedAvatars(prev => new Set([...prev, avatarKey]));
                                                                    e.target.style.display = 'none';
                                                                    const fallback = e.target.nextSibling;
                                                                    if (fallback) fallback.style.display = 'flex';
                                                                }}
                                                            />
                                                            <div 
                                                                className='rounded-full h-12 w-12 bg-gray-400 flex items-center justify-center text-white font-semibold text-base absolute top-0 left-0'
                                                                style={{ display: 'none' }}
                                                            >
                                                                {getUserInitial(displayUser)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className='rounded-full h-12 w-12 bg-gray-400 flex items-center justify-center text-white font-semibold text-base'>
                                                            {getUserInitial(displayUser)}
                                                        </div>
                                                    )}
                                                    {hasUnread && (
                                                        <div className='absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-white'></div>
                                                    )}
                                                        </div>

                                                {/* Content */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center justify-between mb-1'>
                                                        <div className='text-sm font-semibold text-gray-900 truncate'>
                                                            {isConciergeThread ? 'Franklin Desk' : displayUser}
                                                        </div>
                                                        {lastMessageTime && (
                                                            <div className='text-xs text-gray-500 flex-shrink-0 ml-2'>
                                                                {formatTimestamp(lastMessageTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='text-xs text-gray-500 truncate'>
                                                        {lastMessage || 'No messages yet'}
                                                    </div>
                                                </div>
                                    </div>
                                </button>
                                    );
                                })
                            ) : (
                                <div className='p-8 text-center'>
                                    <img 
                                        src={benFranklinThoughtBubble} 
                                        alt="Ben Franklin thought bubble" 
                                        className='w-24 h-auto mx-auto mb-3' 
                                    />
                                    <p className='text-sm font-medium text-gray-700 mb-1'>No conversations yet</p>
                                    <p className='text-xs text-gray-500'>Start messaging sellers from item listings</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Conversation Area - Show draft thread or real conversation */}
                {(() => {
                    const selectedId = routeConvoId || activeConversationId;
                    const selectedConversation = Array.isArray(chats) ? chats.find(c => getConvoId(c) === selectedId) : null;
                    
                    // Show draft thread if draftTo is set
                    if (draftTo && draftReceiver) {
                        return true;
                    }
                    
                    // Show conversation if selected (receiver can be loading)
                    if (selectedId && selectedConversation) {
                        return true;
                    }
                    
                    return false;
                })() ? (
                    <div className='flex-1 flex flex-col bg-[var(--color-bg)]'>
                        {/* Conversation Header */}
                        <div className='h-16 flex items-center gap-3 px-4 border-b border-gray-200 bg-white'>
                            <div className='flex-shrink-0'>
                                {draftReceiver ? (
                                    renderProfilePic(draftReceiver, draftReceiver?.username, 'h-10 w-10')
                                ) : receiver ? (
                                    renderProfilePic(receiver, receiver?.username, 'h-10 w-10')
                                ) : (
                                    <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center'>
                                        <span className='text-xs text-gray-500'>...</span>
                                    </div>
                                )}
                            </div>
                            <div className='flex-1'>
                                <div className='text-base font-semibold text-gray-900'>
                                    {draftReceiver?.username || receiver?.username || receiver?.name || otherUser || 'Loading...'}
                                </div>
                                <div className='text-xs text-gray-500'>
                                    {draftReceiver?.bio 
                                        ? draftReceiver.bio.substring(0, 50) + '...' 
                                        : receiver?.bio 
                                            ? receiver.bio.substring(0, 50) + '...' 
                                            : 'Active'}
                                </div>
                            </div>
                        </div>
                        
                        {/* Messages Area */}
                        <div className='flex-1 overflow-y-auto px-4 py-4'>
                            <ScrollableFeed>
                                {groupedMessages.map((group, groupIndex) => {
                                    const isOwnMessage = group.sender === user;
                                    const showAvatar = groupIndex === 0 || 
                                        (groupIndex > 0 && groupedMessages[groupIndex - 1].sender !== group.sender);
                                    
                                    return (
                                        <div key={groupIndex} className={`flex gap-2 mb-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar - show for first message in group, always visible for incoming messages */}
                                            {showAvatar ? (
                                                <div className="flex-shrink-0">
                                                    {isOwnMessage 
                                                        ? renderProfilePic(sender, sender?.username, 'h-8 w-8')
                                                        : renderProfilePic(receiver, receiver?.username, 'h-8 w-8')
                                                    }
                                                </div>
                                            ) : (
                                                <div className="flex-shrink-0 w-8"></div>
                                            )}
                                            
                                            {/* Message Group */}
                                            <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                {group.messages.map((message, msgIndex) => {
                                                    const isLastInGroup = msgIndex === group.messages.length - 1;
                                                    const isGuestMessage = isOwnMessage && isGuest && !isAuthenticated && (message.sender && message.sender.startsWith('guest_'));
                                                    return (
                                                        <div key={msgIndex} className='group'>
                                                            {isGuestMessage && (
                                                                <div className='text-xs opacity-75 mb-1 text-gray-600'>Guest</div>
                                                            )}
                                                            <div 
                                                                className={`px-4 py-2 rounded-2xl ${
                                                                    isOwnMessage 
                                                                        ? 'bg-blue-500 text-white rounded-br-sm' 
                                                                        : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                                                                }`}
                                                                style={{overflowWrap:'anywhere'}}
                                                            >
                                                                {message.attachment && (
                                                                    <div className='mb-1'>
                                                                        {(() => {
                                                                            const attachmentUrl = normalizeImageUrl(message.attachment);
                                                                            const isImage = attachmentUrl && isImageUrl(attachmentUrl);
                                                                            
                                                                            if (isImage) {
                                                                                return (
                                                                                    <img 
                                                                                        src={attachmentUrl}
                                                                                        alt="Attachment"
                                                                                        className='max-w-[280px] md:max-w-[360px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity'
                                                                                        onClick={() => window.open(attachmentUrl, '_blank', 'noopener,noreferrer')}
                                                                                    />
                                                                                );
                                                                            } else if (attachmentUrl) {
                                                                                return (
                                                                                    <a 
                                                                                        href={attachmentUrl} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className='text-blue-600 hover:underline inline-flex items-center gap-1'
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
                                                                                        }}
                                                                                    >
                                                                                        📎 View Attachment
                                                                                    </a>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                )}
                                                                {message.message && (
                                                                    <div className='text-sm whitespace-pre-wrap'>{message.message}</div>
                                                                )}
                                                            </div>
                                                            {/* Timestamp - only show on last message in group */}
                                                            {isLastInGroup && (
                                                                <div className={`text-xs text-gray-500 mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                                                    {formatTimestamp(message.timestamp || group.timestamp)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                    </div>
                                    </div>
                                    );
                                })}
                        </ScrollableFeed>
                        </div>
                        
                        {/* Input Area */}
                        <div className='border-t border-gray-200 bg-white p-4'>
                            {/* Guest Limit Callout */}
                            {isGuest && !isAuthenticated && hasReachedGuestLimit() && (
                                <div className='mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                    <p className='text-sm text-yellow-800 mb-3'>
                                        To receive replies and continue the conversation, create an account.
                                    </p>
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await demoLogin();
                                                    handleGuestAuthModalSuccess();
                                                } catch (error) {
                                                    console.error('Demo login failed:', error);
                                                }
                                            }}
                                            className="text-sm px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors font-medium"
                                        >
                                            Try Demo
                                        </button>
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="text-sm px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Log in
                                        </button>
                                        <button
                                            onClick={() => navigate('/register')}
                                            className="text-sm px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Register
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Guest Message Count Indicator */}
                            {isGuest && !isAuthenticated && !hasReachedGuestLimit() && (
                                <div className='mb-2 text-xs text-gray-500 text-center'>
                                    Guest mode: {getRemainingGuestMessages()} message{getRemainingGuestMessages() !== 1 ? 's' : ''} remaining
                                    <br />
                                    <span className='text-yellow-600'>Create an account to deliver messages & receive replies.</span>
                                </div>
                            )}
                            
                            {/* Attachment Preview */}
                            {attachmentDisplay && attachment && attachment.type && (
                                <div className='mb-2'>
                                    {(() => {
                                        const fileType = getFileType(attachment.type, false);
                                        if(!fileType || fileType === 'undefined' || fileType.includes('undefined')){
                                            return (
                                                <div className='h-20 w-20 bg-gray-100 rounded-lg p-2 text-xs flex items-center justify-center'>
                                                    Attachment ready
                    </div>
                                            );
                                        }
                                        return (
                                            <div className='h-20 w-20 bg-gray-100 rounded-lg overflow-hidden'>
                                <FileViewer
                                                    fileType={fileType}
                                                    filePath={attachmentDisplay}
                                                    errorComponent={<div className='p-2 text-sm text-gray-500'>Preview unavailable</div>}
                                                />
                                            </div>
                                        );
                                    })()}
                            </div>
                            )}
                            
                            {/* Input Controls */}
                            <div className='flex items-end gap-2'>
                                <button 
                                    onClick={() => handleClick()}
                                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0'
                                    aria-label="Attach file"
                                    disabled={isGuest && !isAuthenticated && hasReachedGuestLimit()}
                                >
                                    <img 
                                        src={require('../assets/attachment.png')} 
                                        alt="Attach"
                                        className='h-5 w-5'
                                    />
                                    <input 
                                        id='selectFile' 
                                        hidden 
                                        type="file" 
                                        ref={inputRef}
                                        onChange={event => processAttachment(inputRef.current.files[0])} 
                                    />
                                </button>
                            
                            <textarea
                                style={{resize:'none'}}
                                onChange={(e) => setText(e.target.value)}
                                value={text}
                                    placeholder={isGuest && !isAuthenticated && hasReachedGuestLimit() ? 'Create an account to continue...' : 'Type a message...'} 
                                    className='flex-1 min-h-[44px] max-h-32 px-4 py-2 rounded-2xl bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed'
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (text.trim() || attachment) {
                                                sendMessage(user || getGuestSessionId(), text, attachment);
                                            }
                                        }
                                    }}
                                    disabled={isGuest && !isAuthenticated && hasReachedGuestLimit()}
                                />
                                
                                <button 
                                onClick={() => sendMessage(user || getGuestSessionId(), text, attachment)}
                                    disabled={(!text.trim() && !attachment) || (isGuest && !isAuthenticated && hasReachedGuestLimit())}
                                    className='p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0'
                                    aria-label="Send message"
                                >
                                    <img 
                                        src={require('../assets/send.png')} 
                                        alt="Send"
                                        className='h-5 w-5 filter brightness-0 invert'
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='flex-1 flex items-center justify-center bg-[var(--color-bg)]'>
                        <div className='text-center max-w-md px-4'>
                            {Array.isArray(chats) && chats.length === 0 ? (
                                <>
                                    <img 
                                        src={benFranklinThoughtBubble} 
                                        alt="Ben Franklin thought bubble" 
                                        className='w-80 h-auto mx-auto mb-4' 
                                    />
                                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>No conversations yet</h3>
                                    <p className='text-base text-gray-500 mb-6'>Start a conversation by messaging a seller from an item listing.</p>
                                    <Link 
                                        to="/store"
                                        className='inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors font-medium'
                                    >
                                        Browse Store
                                        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <img 
                                        src={benFranklinThoughtBubble} 
                                        alt="Ben Franklin thought bubble" 
                                        className='w-80 h-auto mx-auto mb-4' 
                                    />
                                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>Select a conversation</h3>
                                    <p className='text-base text-gray-500'>Choose a conversation from the sidebar to start messaging</p>
                                </>
                            )}
                        </div>
                </div>
                )}
                
            </div>

        </div>
    )
}


export default Messages;