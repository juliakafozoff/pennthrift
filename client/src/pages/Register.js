import { useState } from 'react';
import Form from '../components/Form';
import {useNavigate} from 'react-router-dom';
import api from '../api/http';
const Register = () =>{
    const navigate = useNavigate();
    const [error, setError] = useState();
    const [loading, setLoading] = useState(false);
    const address = '/api/auth/register'; 

    function userDetails(username,password){
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
        };

        api.post(address, data).then(res =>{
            setLoading(false);
            // Server returns "successful" on success or "Error: User is already registered" on duplicate
            if (res.data && (res.data.includes("Error") || res.data.includes("error"))) {
                setError('Username has already been taken');
            } else if (res.data === "successful") {
                // Passport session is now established via req.logIn()
                // No need to set global.LOGGED_IN - ProtectedRoute will check auth via GET /api/auth
                
                // Wait briefly for session cookie to propagate, then navigate
                // ProtectedRoute will check auth and handle redirect if needed
                setTimeout(() => {
                    navigate('/profile', { replace: true });
                }, 200);
            } else {
                setError('Registration failed. Please try again.');
            }
        }).catch(err => {
            setLoading(false);
            console.error('Registration error:', err);
            setError('Registration failed. Please check your connection and try again.');
        });
    }

    function reset(){
        setError(null)
    }

    return(
        <div className='grid grid-main justify-center w-full h-full items-center'>
            <div className='col-span-8 flex flex-col justify-center'>
                <div className='my-5 text-center text-5xl'>Welcome!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                <Form
                    userDetails={userDetails}
                    reset={reset}
                    error={error}
                    loading={loading}
                    name='Register'/>
            </div>
        </div>
        
    )
}


export default Register;