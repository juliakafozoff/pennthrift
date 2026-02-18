import { useState } from 'react';
import Form from '../components/Form';
import {useNavigate} from 'react-router-dom';
import api from '../api/http';
import { editUserProfile, getUserProfile } from "../api/ProfileAPI";
const moment = require('moment');

const Login = () =>{
    const navigate = useNavigate()
    const [error, setError] = useState();
    const address = '/api/auth/login'; 
    
    function userDetails(username,password){
        const data = {
            'username':username,
            'password':password,
            'email':username,
        };

        api.post(address, data).then(res =>{
            if (res.status === 200) {
                editUserProfile(username, { last_login: res.time }).then(res => {
                    if (res === 'Success! User updated.') {
                        global.LOGGED_IN = true;
                        navigate('/profile', { replace: true })
                    }
                });
            } else if (res.status === 202) {
                const currentTimestamp = moment().unix(); // in seconds
                const currentDatetime = moment(currentTimestamp * 1000).format(
                        'YYYY-MM-DD HH:mm:ss'
                );
                if (Math.abs(new Date(currentDatetime) - new Date(res.data.user.last_login)) > 120000) { //2 minutes
                    editUserProfile(username, { locked_out: false }).then(res => {
                        if (res === 'Success! User updated.') {
                            return setError('You have now regained login access. Please try again to login to your account.');
                        }
                    });
                } else {
                    editUserProfile(username, { locked_out: true }).then(res => {
                        if (res === 'Success! User updated.') {
                            return setError('You have been locked out for too many failed attempts. Please try again later.')
                        }
                    });
                }
            }
        }).catch(err => {
            if (err.message.split(" ").pop() == '401' || err.message.split(" ").pop() == '429') {
                getUserProfile(username).then(res => {
                    if (res != null) {
                        editUserProfile(username, { locked_out: true }).then(res => {
                            console.log(res)
                            if (res === 'Success! User updated.') {
                                return setError('You have been locked out for too many failed attempts. Please try again later.')
                            } else {
                                return null;
                            }
                        });
                    } else {
                        return setError('We don’t recognize that username and password. Please try again.')
                    }
                });   
            }
        });
    }

    function reset(){
        setError(null)
    }

    return(
        <div className='grid grid-main justify-center w-full h-full items-center'>
            <div className='col-span-8 flex flex-col justify-center'>
                <div className='my-5 text-center text-5xl'>Welcome back!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                <Form
                    userDetails={userDetails}
                    reset={reset}
                    error={error}
                    name='Login'/>
            </div>
        </div>
    )
    
}


export default Login;