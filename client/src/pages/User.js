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
                    }
                } catch (error) {
                    console.error('Error loading user info:', error);
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
                navigate( `/profile/messages/${id}`)
            });
        }else if(!viewer){
            navigate('/login')
        }
        

    }
    
    // Initialize socket and load items - only when authenticated and username changes
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
        if (items.length === 0 && username && isAuthenticated) {
            api.get(`/api/profile/items/${username}`)
                .then(res => {
                    if (mounted) {
                        const itemsSafe = Array.isArray(res.data?.items) ? res.data.items : [];
                        setItems(itemsSafe.reverse());
                    }
                })
                .catch(e => {
                    console.error('Error loading items:', e);
                    if (mounted) {
                        setItems([]);
                    }
                });
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
    }, [username, isAuthenticated]); // Only re-run when username or auth changes, NOT on every state change
    



    return(
        <div>
            <Header/>
            <div className="grid grid-main justify-center w-full h-full px-5 md:px-10">
                <div className="col-span-8 mt-20 lg:gap-20 grid grid-cols-6">
                    <div className="lg:col-span-2 col-span-6 flex flex-col  items-center">
                        <img
                            className="w-60 rounded-full h-60" 
                            src={imageDisplay || placeholder}/>
                        <div className="my-2 mt-5 self-start">Graduating Class : {year}</div>
                        <div className="my-2 lg:max-w-[250px] self-start">Interests: 
                            {
                                Array.isArray(interests) && interests.map((intr, index) => {
                                    return(
                                        <span key={index}> {intr} {index < interests.length - 1 ? ", " : ""}</span>
                                    )
                                })
                            }
                        </div>
                        <div className="border my-5 w-full p-10 border-gray-200">
                                {bio}
                        </div>
                    </div>
                    <div className="lg:col-span-4 col-span-6  h-fit grid gap-5">
                        <div className="flex justify-between">
                            <div>
                                
                                <div className="text-4xl mb-10 h-fit font-semibold">{username}</div>
                                <div className="flex ">

                                    <img className="w-8 h-5" src={require('../assets/vimeo.png')}/>
                                    <div className="font-bold">{venmo}</div>
                                </div>
                            </div>
                            {
                                    viewer != username && <div className="h-full text-white flex">
                                    <div className="p-3 justify-center cursor-pointer flex w-28 rounded-3xl h-fit font-semibold m-2 bg-[#3289FF]">
                                        Follow
                                    </div>
                                    
                                    <div
                                        onClick={() => processMessageRequest()} 
                                        className="p-3 h-fit cursor-pointer justify-center flex rounded-3xl w-28 m-2  font-semibold bg-[#3289FF]">
                                        Message
                                    </div>
                                </div>
                            }
                            
                        </div>
                        <div className="">
                            <StoreItems
                                data={Array.isArray(items) ? items : []}/>
                        </div>
                    </div>
                    
                </div>
            </div>

        </div>
    )
}

export default User;
    

    

