
import Header from '../components/Header';
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserChats, getUserProfile, getUserImage } from "../api/ProfileAPI";
import axios from "axios";
import placeholder from '../assets/placeholder_user_sm.png'
import { Link, useLocation } from 'react-router-dom';
import ScrollableFeed from 'react-scrollable-feed'
import FileViewer from 'react-file-viewer';
import io from 'socket.io-client';
import { path } from '../api/ProfileAPI';

const Messages = props => {

    const {id} = useParams();

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
            const res = await axios.get('/api/auth/user');
            setUser(res.data)
        }
        if(chats.length === 0 && user ){
            setChats(  await getUserChats(user));
        } 
    

        if((!receiver || !sender) && users && user && allowed){
            users.map( async usr => {
                if(user != usr){
                    if(!receiver)setReceiver( await getUserProfile(usr))
                }else{
                    if(!sender)setSender( await getUserProfile(user))
                }
            })

        }
        
    }
    setUp()
    
    async function sendMessage(user, message, attachment){
        if(allowed && receiver && socketRef.current){
            if(attachment){
                var formData = new FormData();
                formData.append("file", attachment);
                axios.post('/api/file/upload', formData,{
                    headers: {
                    'Content-Type': 'multipart/form-data'
                    }
                }).then( async res => {
                    const data = { sender:user, message:message, attachment:res.data, id:id, receiver:receiver.username }
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

 
    function getMessageType(user, text, attachment, msgSender, image  ){
        if(msgSender == user && sender){
            return(
                <div className='flex m-5 justify-end gap-2'>
                    <div style={{overflowWrap:'anywhere'}} className='p-5 max-w-[70%] flex-col  flex w-fit  rounded-2xl border border-black'>
                    {
                            attachment && 
                            <div onClick={() => window.open(attachment,'_blank')} className='max-h-[240px] flex  my-2 w-fit bg-white'>
                                <FileViewer
                                        fileType={getFileType(attachment, true)}
                                        filePath={attachment}/>
                            </div>
                        }
                        {text}
                    </div>
                    
                    <img src={sender.profile_pic || placeholder} className='rounded-full  h-10 w-10 h-full bg-black mx-2 '/>
                </div>
            )
            
        }else if(msgSender != user && sender && msgSender){
            return(
                <div className='flex m-5 gap-2'>
                    <img src={receiver.profile_pic || placeholder} className='rounded-full  h-10 w-10 h-full bg-black mx-2 '/>
                    <div style={{overflowWrap:'anywhere'}}  className='p-5 max-w-[70%] flex-col flex  rounded-2xl bg-gray-300'>
                    {
                            attachment && 
                            <div onClick={() => window.open(attachment,'_blank')} className='max-h-[240px] flex  my-2  bg-white'>
                                <FileViewer
                                        fileType={getFileType(attachment, true)}
                                        filePath={attachment}/>
                            </div>
                        }
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

    function loadMessages(){
        if(messages.length == 0 && id && socketRef.current){
            socketRef.current.emit('load', id);
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
        
        if(!stateId && id){
            setStateId(id)
        }
        if(stateId != id && stateId) {
            setStateId(id)
            refresh()
        };
        if(id && socketRef.current)loadMessages(id);
        
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
            if(!url && src){
                var parts = src.split('/')
                return parts[parts.length - 1];
            }else{
                return src.split(/[#?]/)[0].split('.').pop().trim()
            }

        }catch{

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
                            return(
                                <Link key={chat._id} to={`/profile/messages/${chat._id}`} state={chats}>
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
                                                    
                                                        <div key={usr} className={`flex px-2 py-5 mb-1 items-center ${chat._id === id ? ' bg-blue-300 ' : ''}`  }>
                                                            
                                                            <img src={ chat.image || placeholder} className='rounded-full  h-10 w-10 h-full bg-black mx-2 '/>
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
                            attachmentDisplay && 
                            <div className='h-40 my-2 w-40 bg-white'>
                                <FileViewer
                                        fileType={getFileType(attachment.type, false)}
                                        filePath={attachmentDisplay}/>
                            </div>
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