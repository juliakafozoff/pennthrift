import { useState } from 'react';
import Form from '../components/Form';
import {useNavigate, useLocation} from 'react-router-dom';
import api from '../api/http';
import { editUserProfile, getUserProfile } from "../api/ProfileAPI";
const moment = require('moment');

const Login = () =>{
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState();
    const [loading, setLoading] = useState(false);
    const address = '/api/auth/login';
    
    // Get the intended destination from state, or default to /profile
    const from = location.state?.from?.pathname || '/profile'; 
    
    function userDetails(username,password){
        console.log('Login attempt:', { username, hasPassword: !!password });
        
        // Validate inputs
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        
        // Clear previous errors and set loading state
        setError(null);
        setLoading(true);
        
        const data = {
            'username':username,
            'password':password,
            'email':username,
        };

        console.log('Sending login request to:', address);
        api.post(address, data).then(res =>{
            console.log('Login response:', res.status, res.data);
            setLoading(false);
            if (res.status === 200) {
                // Passport session is now established via req.logIn()
                // No need to set global.LOGGED_IN - ProtectedRoute will check auth via GET /api/auth
                
                // Try to update last_login, but don't block navigation if it fails
                editUserProfile(username, { last_login: res.data?.time || res.time }).then(res => {
                    // Log success/failure but don't block navigation
                    if (res !== 'Success! User updated.') {
                        console.warn('Failed to update last_login, but login was successful');
                    }
                }).catch(err => {
                    console.error('Error updating last_login:', err);
                    // Don't block navigation on this error
                });
                
                // Wait briefly for session cookie to propagate, then navigate
                // ProtectedRoute will check auth and handle redirect if needed
                setTimeout(() => {
                    navigate(from, { replace: true });
                }, 200);
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
            setLoading(false);
            console.error('Login error:', err);
            const statusCode = err.response?.status;
            
            // Handle different error status codes
            if (statusCode === 429) {
                // Rate limiting from express-brute - temporary, don't set permanent lockout
                setError('Too many login attempts. Please wait a moment and try again.');
            } else if (statusCode === 401) {
                // Authentication failed - invalid credentials
                setError("We don't recognize that username and password. Please try again.");
            } else {
                // Generic error message for other failures
                setError('Login failed. Please check your credentials and try again.');
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
                    loading={loading}
                    name='Login'/>
            </div>
        </div>
    )
    
}


export default Login;