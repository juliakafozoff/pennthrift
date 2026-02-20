
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
    const { isAuthenticated, user: authUser, demoLogin } = useAuth();
    const {id: chatIdParam} = useParams();
    // Fix: Ensure id is always a string, defensive guard against objects
    const id = typeof chatIdParam === 'string' && chatIdParam !== '[object Object]' 
        ? chatIdParam 
        : (chatIdParam && typeof chatIdParam === 'object' ? String(chatIdParam) : (chatIdParam || null));

    const location = useLocation();
    const propsChat = location.state;
    const [chats, setChats] = useState(propsChat || []);
    const [user, setUser] = useState('');
    const [messages, setMessages] = useState([]);
    const [text, setText]           = useState('');
    const [attachment, setAttachment] = useState('');
    const [attachmentDisplay , setAttachmentDisplay]    = useState();
    const [receiver , setReceiver]       = useState('');
    const [users, setUsers]             = useState([])
    const [sender, setSender]           = useState('');
    const [chatImages, setChatImages] = useState('');
    const [stateId , setStateId]  = useState(id);
    const [menuOpen, setMenuOpen] = useState(true)
    const inputRef = useRef()
    const navigate = useNavigate();
    const [processed, setProcessed] = useState(false)
    const [allowed, setAllowed] = useState(false)
    const [joined, setJoined] = useState(false);
    const socketRef = useRef(null); 
    // Track failed avatar loads to persist fallback state
    const [failedAvatars, setFailedAvatars] = useState(new Set());
    // Guest session state
    const [isGuest, setIsGuest] = useState(false);
    const [guestMessageCount, setGuestMessageCount] = useState(0);
    const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
    
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
        if(!processed && id){
            if(user){
                const chts = await getUserChats(user);
                chts.map( cht => {
                    if(cht._id === id){
                        setAllowed(true);
                    }
                })
                
                setProcessed(true)
            } else if (!isAuthenticated && id) {
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
    
    checkAllowed();



    async function setUp(){
       
        if(!user){
            const res = await api.get('/api/auth/user');
            setUser(res.data)
        }
        if(chats.length === 0 && user ){
            setChats(  await getUserChats(user));
        } 
    

        // Fix: Always fetch receiver and sender profiles when we have users array and current user
        if(Array.isArray(users) && users.length > 0 && user && allowed){
            // Find the other user (not the current user)
            const otherUser = users.find(usr => usr !== user);
            // Fetch receiver profile if we don't have it or if it's missing profile data
            if(otherUser && (!receiver || !receiver.username || (!receiver.profile_pic && !receiver.profilePic && !receiver.avatar))){
                try {
                    const receiverProfile = await getUserProfile(otherUser);
                    setReceiver(receiverProfile);
                } catch (error) {
                    console.error('Error fetching receiver profile:', error);
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
    
    // Ensure concierge conversation exists for demo users on mount and when user changes
    useEffect(() => {
        const ensureConciergeForDemo = async () => {
            const isDemoUser = authUser?.username === 'demo' || authUser?.isDemo === true;
            if (isDemoUser && isAuthenticated) {
                try {
                    // Ensure concierge thread exists
                    await api.post('/api/auth/demo/ensure-concierge-thread', {}, { withCredentials: true });
                    
                    // Refresh chats after ensuring concierge exists
                    const currentUser = user || authUser?.username;
                    if (currentUser) {
                        const updatedChats = await getUserChats(currentUser);
                        if (Array.isArray(updatedChats)) {
                            setChats(updatedChats);
                        }
                    }
                } catch (error) {
                    console.error('Error ensuring concierge thread:', error);
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
        
        ensureConciergeForDemo();
    }, [isAuthenticated, authUser?.username, user]);
    
    // Mark concierge conversation as opened when it's loaded
    useEffect(() => {
        if (id && Array.isArray(users) && users.includes('franklindesk')) {
            const isDemoUser = authUser?.username === 'demo' || authUser?.isDemo === true;
            if (isDemoUser) {
                // Ensure demoSessionId exists (generate if missing)
                let sessionId = sessionStorage.getItem('demoSessionId');
                if (!sessionId) {
                    // Generate UUID v4
                    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = Math.random() * 16 | 0;
                        const v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                    sessionStorage.setItem('demoSessionId', sessionId);
                }
                
                // Set flag that concierge has been opened
                localStorage.setItem(`demoConciergeOpened:${sessionId}`, '1');
                
                // Trigger header unread update
                if (socketRef.current) {
                    socketRef.current.emit('unread');
                }
            }
        }
    }, [id, users, authUser]);
    
    // Auto-select first conversation if none selected and conversations exist
    useEffect(() => {
        if (!id && Array.isArray(chats) && chats.length > 0 && user && !processed) {
            const firstChat = chats[0];
            if (firstChat && firstChat._id) {
                const firstChatId = typeof firstChat._id === 'string' ? firstChat._id : String(firstChat._id);
                if (firstChatId && firstChatId !== '[object Object]' && firstChatId !== 'undefined') {
                    navigate(`/profile/messages/${firstChatId}`, { replace: true });
                }
            }
        }
    }, [chats, user, id, processed, navigate]);
    
    async function sendMessage(userParam, message, attachment){
        // Block demo users from messaging real users
        if (authUser && !requireAuthForMessaging(authUser)) {
            setShowMessagingBlockedModal(true);
            return;
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
        
        if(allowed && receiver && socketRef.current){
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
                        id: id, 
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
                    id: id,
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

    function loadMessages(chatId = id){
        // Defensive: Ensure chatId is a valid string
        const validChatId = typeof chatId === 'string' && chatId !== '[object Object]' && chatId !== 'undefined' ? chatId : null;
        if(messages.length == 0 && validChatId && socketRef.current){
            socketRef.current.emit('load', validChatId);
        }
    }
    function refresh(){
        setMessages([])
        loadMessages();
        setReceiver('')
        if(socketRef.current && id){
            socketRef.current.emit('join-room', id);
        }
        window.location.reload()

    }

    useEffect(() => {
        // Initialize socket inside useEffect
        if (typeof window !== 'undefined' && path && !socketRef.current) {
            try {
                socketRef.current = io.connect(`${path}/api/messages`, {
                    withCredentials: true,
                    transports: ['websocket', 'polling']
                });
            } catch (e) {
                console.error('Error initializing socket:', e);
            }
        }
        
        // Defensive: Only proceed if id is a valid string
        if(id && typeof id === 'string' && id !== '[object Object]' && id !== 'undefined'){
            if(!stateId){
            setStateId(id)
        }
            if(stateId !== id && stateId) {
            setStateId(id)
            refresh()
            }
            if(socketRef.current)loadMessages(id);
        } else if(id && (typeof id === 'object' || id === '[object Object]')) {
            console.error('Invalid chat ID detected (object instead of string):', id);
            // Redirect to messages list if invalid ID
            navigate('/profile/messages', { replace: true });
        }
        
        if(socketRef.current){
            socketRef.current.on('allMessages', data => {
                if(data && data.messages && data.messages.length > 0){
                    // Add timestamps to messages if missing
                    const messagesWithTimestamps = data.messages.map((msg, idx) => ({
                        ...msg,
                        timestamp: msg.timestamp || new Date(Date.now() - (data.messages.length - idx) * 60000).toISOString()
                    }));
                    setMessages(messagesWithTimestamps);
                }else{
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
            
            if(id && user && sender && Array.isArray(sender.unread) && sender.unread.includes(id)){
                socketRef.current.emit('clear-unread',{id:id, username:user})
            }
            
            if(!joined && id){
                socketRef.current.emit('join-room', id);
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
        
    },[id, messages,receiver, processed, allowed, chats, user, users, attachmentDisplay, attachment, sender, joined])
    
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
    const unreadCounts = sender?.unread || [];

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
                            if(!chat || !chat._id) return null;
                                    const chatId = typeof chat._id === 'string' ? chat._id : String(chat._id);
                                    if(!chatId || chatId === '[object Object]' || chatId === 'undefined') {
                                        return null;
                                    }
                                    
                                    const otherUserInChat = Array.isArray(chat.users) 
                                        ? chat.users.find(usr => usr !== user) 
                                        : null;
                                    
                                    if (!otherUserInChat) return null;
                                    
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
                                    
                                    const isSelected = chatId === id;
                                    const hasUnread = Array.isArray(unreadCounts) && unreadCounts.includes(chatId);
                                    const avatarKey = `sidebar-${otherUserInChat}`;
                                    const hasFailed = failedAvatars.has(avatarKey);
                                    
                                    return(
                                        <Link 
                                            key={chatId} 
                                            to={`/profile/messages/${chatId}`} 
                                            state={chats}
                                            className={`block hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                        >
                                            <div className='flex items-center gap-3 px-4 py-3'>
                                                {/* Avatar */}
                                                <div className='flex-shrink-0 relative'>
                                                    {chat.image && !hasFailed && normalizeImageUrl(chat.image) ? (
                                                        <>
                                                            <img 
                                                                src={normalizeImageUrl(chat.image)} 
                                                                alt={otherUserInChat}
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
                                                                {getUserInitial(otherUserInChat)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className='rounded-full h-12 w-12 bg-gray-400 flex items-center justify-center text-white font-semibold text-base'>
                                                            {getUserInitial(otherUserInChat)}
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
                                                            {otherUserInChat}
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
                                </Link>
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
                {/* Conversation Area */}
                {id && receiver ? (
                    <div className='flex-1 flex flex-col bg-[var(--color-bg)]'>
                        {/* Conversation Header */}
                        <div className='h-16 flex items-center gap-3 px-4 border-b border-gray-200 bg-white'>
                            <div className='flex-shrink-0'>
                                {renderProfilePic(receiver, receiver?.username, 'h-10 w-10')}
                            </div>
                            <div className='flex-1'>
                                <div className='text-base font-semibold text-gray-900'>
                                    {receiver.username || otherUser}
                                </div>
                                <div className='text-xs text-gray-500'>
                                    {receiver.bio ? receiver.bio.substring(0, 50) + '...' : 'Active'}
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