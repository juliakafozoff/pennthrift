import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/ProfileAPI';
import io from 'socket.io-client';
import React from 'react';
import { path } from '../api/ProfileAPI';

const socket = io.connect(`${path}/api/messages`, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});


const Header = props =>{
    const navigate = useNavigate()
    const [user, setUser] = useState();
    const [unread, setUnread] = useState(0);
    const [processing , setProcessing] = useState(false)

    function logOut(){
        axios.post('/api/auth/logout').then(res => navigate('/login', { replace: true }))
        global.LOGGED_IN = false;
    }
    async function setUp(){
        if(!user){
            const res = await axios.get('/api/auth/user');
            setUser(res.data);
            if(res.data){
                const profile =  await getUserProfile(res.data);
                setUnread(profile.unread.length)
            }
        }
        
    }

    async function updateUnread(){
        if(user && !processing){
            setProcessing(true)
            const profile =  await getUserProfile(user);
            setUnread(profile.unread.length)
            setProcessing(false);
        }

    }
    useEffect(() => {
        setUp();
        
        socket.on('unread', () => {
            updateUnread();
        })

    }, [user, unread])

   
    return(
        <div data-testid="header" dataclassName="w-full bg-[#454545] py-2 flex justify-between h-12">
            {
                global.LOGGED_IN &&
                 <div data-testid="logout" onClick={() => logOut()}className='h-full cursor-pointer w-40 flex mx-5 justify-center items-center bg-white'>Logout</div>
            
            }
            {
                !global.LOGGED_IN &&
                <Link to='/login' className='h-full cursor-pointer w-40 flex mx-5 justify-center items-center bg-white'>Login</Link>
            }
            <div data-testid="flex" className='flex'>
                <Link to='/store'><img className='mx-1 w-8 h-8' src={require('../assets/shop_bag.png')}/></Link>
                <Link data-testid="relative" className='relative' to='/profile/messages'>
                    <div data-testid="unread"className='flex justify-center items-center py-[2px] px-[3px] text-white text-xs right-0 absolute rounded-full bg-red-600'>
                        {unread}
                    </div>
                    <img data-testid="image" className='mx-1 w-8 h-8' src={require('../assets/messages.png')}/>
                </Link>
                <Link to='/'><img className='mx-1 w-8 h-8' src={require('../assets/favourite.png')}/></Link>
                <Link to='/profile'><img className='mx-1 w-8 h-8' src={require('../assets/placeholder_user_sm.png')}/></Link>

            </div>
        </div>
    )

}

export default Header;