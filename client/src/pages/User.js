import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import placeholder from '../assets/placeholder_user.png';
import StoreItems from '../components/StoreItems';
import { updateViews, getUserProfile } from "../api/ProfileAPI";
import { useParams, useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import { path } from "../api/ProfileAPI";

const socket = io.connect(`${path}/api/messages`, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

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

    const getUserInfo = async () => {
        if (!userInfo) {
            const res = await axios.get('/api/auth/user');
            setViewer(res.data);
            if(username)setUserInfo(await getUserProfile(username));
        }
        if(userInfo && !processed){
            processUserInfo(userInfo);
            setProcessed(true);

        }
        if(viewer && !viewed){
            setViewed(true)
            updateViews(username);
        }
    }

    getUserInfo();

    function processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        setBio(bio);
        setYear(class_year);
        if(interests)setInterests(interests);
        setVenmo(venmo);
        setImageDisplay(profile_pic);

    }
    async function processMessageRequest(){
        if(viewer){
            
            const users = [viewer, username];
            socket.emit('get-open', users);
            socket.on('message-navigate', id => {
                navigate( `/profile/messages/${id}`)
            });
        }else{
            navigate('/login')
        }
        

    }
    useEffect(() => {
        
        if(items.length === 0 && username){
    
            axios.get(`/api/profile/items/${username}`)
                    .then( res => {setItems(res.data.items.reverse())})
                    .catch(e => console.log(e))

        }
    },[items, bio, interests, imageDisplay, venmo, year])
    



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
                                interests.map((intr, index) => {
                                    return(
                                        <span> {intr} {index < interests.length - 1 ? ", " : ""}</span>
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
                                data={items}/>
                        </div>
                    </div>
                    
                </div>
            </div>

        </div>
    )
}

export default User;
    

    

