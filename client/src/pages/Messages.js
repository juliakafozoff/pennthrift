
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

const Messages = props => {

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
            
            }
        }
    }
    checkAllowed();



    async function setUp(){
       
        if(!user){
            const res = await api.get('/api/auth/user');
            setUser(res.data)
        }
        if(chats.length === 0 && user ){
            setChats(  await getUserChats(user));
        } 
    

        // Fix: Only fetch receiver profile when we have users array and current user
        if((!receiver || !sender) && Array.isArray(users) && users.length > 0 && user && allowed){
            // Find the other user (not the current user)
            const otherUser = users.find(usr => usr !== user);
            if(otherUser && !receiver){
                try {
                    const receiverProfile = await getUserProfile(otherUser);
                    setReceiver(receiverProfile);
                } catch (error) {
                    console.error('Error fetching receiver profile:', error);
                }
            }
            // Set sender profile if not set
            if(!sender && user){
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
    
    async function sendMessage(user, message, attachment){
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
                    
                    const data = { sender:user, message:message, attachment:normalizedUrl || '', id:id, receiver:receiver.username }
                    await socketRef.current.emit('send-message', data )
                    setAttachment('');
                    setAttachmentDisplay('')
    
                })
            }else{
                const data = { sender:user, message:message, attachment:attachment, id:id,receiver:receiver.username }
                await socketRef.current.emit('send-message', data )
            }
            setText('')

        }
        

    }

 
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
        
        // Helper to render profile picture with fallback
        const renderProfilePic = (userObj, username) => {
            const picUrl = normalizeImageUrl(userObj?.profile_pic);
            const displayName = username || userObj?.username || '';
            const initial = getUserInitial(displayName);
            
            if (picUrl) {
                return (
                    <img 
                        src={picUrl} 
                        alt={displayName}
                        className='rounded-full h-10 w-10 bg-black mx-2 object-cover'
                        onError={(e) => {
                            // Fallback to initial circle if image fails
                            e.target.style.display = 'none';
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = 'flex';
                        }}
                    />
                );
            }
            // Show initial circle as fallback
            return (
                <div 
                    className='rounded-full h-10 w-10 bg-gray-600 mx-2 flex items-center justify-center text-white font-semibold text-sm'
                    style={{ display: picUrl ? 'none' : 'flex' }}
                >
                    {initial}
                </div>
            );
        };
        
        if(msgSender == user && sender){
            return(
                <div className='flex m-5 justify-end gap-2'>
                    <div style={{overflowWrap:'anywhere'}} className='p-5 max-w-[70%] flex-col  flex w-fit  rounded-2xl border border-black'>
                        {renderAttachment()}
                        {text}
                    </div>
                    
                    <div className='relative'>
                        {renderProfilePic(sender, sender?.username)}
                        <div 
                            className='rounded-full h-10 w-10 bg-gray-600 mx-2 flex items-center justify-center text-white font-semibold text-sm absolute top-0 left-0'
                            style={{ display: 'none' }}
                        >
                            {getUserInitial(sender?.username)}
                        </div>
                    </div>
                </div>
            )
            
        }else if(msgSender != user && sender && msgSender){
            return(
                <div className='flex m-5 gap-2'>
                    <div className='relative'>
                        {renderProfilePic(receiver, receiver?.username)}
                        <div 
                            className='rounded-full h-10 w-10 bg-gray-600 mx-2 flex items-center justify-center text-white font-semibold text-sm absolute top-0 left-0'
                            style={{ display: 'none' }}
                        >
                            {getUserInitial(receiver?.username)}
                        </div>
                    </div>
                    <div style={{overflowWrap:'anywhere'}}  className='p-5 max-w-[70%] flex-col flex  rounded-2xl bg-gray-300'>
                        {renderAttachment()}
                        {text}
                    </div>
                </div>            
            )

        }
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
                    setMessages(data.messages)
                }else{
                    setMessages(['string to stop infinite loop'])
                }
                if(data && data.users){
                    setUsers(data.users)
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
        }
        
        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.off('allMessages');
                socketRef.current.off('receive-message');
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

    return(
        
        <div className="h-full">
            <Header/>
            <div className="fixed flex w-full  h-full ">
                <div className={`sidebar text-white  bg-black ${ menuOpen ? ' w-96' : 'w-14'}`}>
                    <div className='bg-white flex items-center relative h-14 w-full '>
                        {
                            menuOpen && 
                            <div className='text-black my-auto ml-5 text-lg font-semibold absolute left-0'>Recents</div>
                        }
                        <img onClick={() => setMenuOpen(!menuOpen)}className='absolute cursor-pointer my-4 right-0 mr-5' src={getMenuIcon(menuOpen)}/>
                    </div>
                    { menuOpen &&
                        Array.isArray(chats) && chats.map( chat => {
                            if(!chat || !chat._id) return null;
                            // Fix: Ensure chatId is always a string, never an object
                            const chatId = typeof chat._id === 'string' ? chat._id : String(chat._id);
                            if(!chatId || chatId === '[object Object]' || chatId === 'undefined') {
                                console.error('Invalid chat ID:', chat._id);
                                return null;
                            }
                            return(
                                <Link key={chatId} to={`/profile/messages/${chatId}`} state={chats}>
                                    <div>
                                    
                                        {
                                            Array.isArray(chat.users) && chat.users.map( usr => {
                                                let lastMessage;  
                                                try{
                                                    const messagesSafe = Array.isArray(chat.messages) ? chat.messages : [];
                                                    lastMessage = messagesSafe.length > 0 ? messagesSafe[messagesSafe.length - 1]?.message : '...';
                                                }catch{
                                                    lastMessage = '...';
                                                }
                                                if(user && usr != user){
                                                    return(
                                                    
                                                        <div key={usr} className={`flex px-2 py-5 mb-1 items-center ${chatId === id ? ' bg-blue-300 ' : ''}`  }>
                                                            <div className='relative'>
                                                                {chat.image && normalizeImageUrl(chat.image) ? (
                                                                    <>
                                                                        <img 
                                                                            src={normalizeImageUrl(chat.image)} 
                                                                            alt={usr}
                                                                            className='rounded-full h-10 w-10 bg-black mx-2 object-cover'
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                                const fallback = e.target.nextSibling;
                                                                                if (fallback) fallback.style.display = 'flex';
                                                                            }}
                                                                        />
                                                                        <div 
                                                                            className='rounded-full h-10 w-10 bg-gray-600 mx-2 flex items-center justify-center text-white font-semibold text-sm absolute top-0 left-0'
                                                                            style={{ display: 'none' }}
                                                                        >
                                                                            {getUserInitial(usr)}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className='rounded-full h-10 w-10 bg-gray-600 mx-2 flex items-center justify-center text-white font-semibold text-sm'>
                                                                        {getUserInitial(usr)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className=''>
                                                                <div className='text-xl font-semibold'>{usr}</div>
                                                                <div className='text-xs text-gray-500'>{lastMessage}</div>
                                                            </div>
                                                        </div>

                                                    )
                                                }
                                                return null;
                                            })
                                        }
                          
                                    </div>
                                </Link>

                            )
                        })
                    }
                </div>
                { 
                    id && <div className='w-full h-ful relative  flex flex-col'>
                    <div className='h-14 p-2 flex items-center  w-full bg-gray-300'>
                        
                        <img src={receiver.profile_pic || placeholder} className='rounded-full  h-10 w-10 h-full bg-black mx-2 '/>
                        {receiver.username}

                    </div>
                    <div className='h-full overflow-y-scroll  flex flex-col  w-full'>
                        <ScrollableFeed>
                        {
                            Array.isArray(messages) && messages.map( (message, index) => {
                                if(!message || message === 'string to stop infinite loop') return null;
                                return(
                                    <div key={index}>
                                        {getMessageType(user, message.message, message.attachment, message.sender)}
                                    </div>
                                )
                            })
                        }
                        </ScrollableFeed>
                        
                        
                    </div>
                    <div className='h-fit px-10  mb-10 bg-black'>
                        {
                            attachmentDisplay && attachment && attachment.type && 
                            (() => {
                                const fileType = getFileType(attachment.type, false);
                                if(!fileType || fileType === 'undefined' || fileType.includes('undefined')){
                                    return (
                                        <div className='h-40 my-2 w-40 bg-white p-2 text-xs'>
                                            Attachment ready
                                        </div>
                                    );
                                }
                                return (
                                    <div className='h-40 my-2 w-40 bg-white'>
                                        <FileViewer
                                            fileType={fileType}
                                            filePath={attachmentDisplay}
                                            errorComponent={<div className='p-2 text-sm text-gray-500'>Preview unavailable</div>}
                                        />
                                    </div>
                                );
                            })()
                        }
                        <div className='flex  h-32 bg-black items-center bg-white w-full justify-self-end gap-2'>
                            <div className='w-fit h-fit' onClick={() => handleClick()}>
                                <img src={require('../assets/attachment.png')} className='rounded-full cursor-pointer h-6 w-6 h-full mx-2 '/>
                                <input id='selectFile' 
                                        hidden type="file" 
                                        ref={inputRef}
                                        onChange={event => processAttachment(inputRef.current.files[0]) } />

                            </div>
                            
                            <textarea
                                style={{resize:'none'}}
                                onChange={(e) => setText(e.target.value)}
                                value={text}
                                placeholder='Input your message..' 
                                className='w-full h-12   rounded-2xl bg-gray-200 py-2 px-5  '/>

                            <img src={require('../assets/send.png')} 
                                onClick={() => sendMessage(user, text, attachment)}
                                className='rounded-full cursor-pointer h-6 w-6 h-full mx-2 '/>
                        </div>
                        
                    </div>
                    
                </div>
                
                }
                
            </div>

        </div>
    )
}


export default Messages;