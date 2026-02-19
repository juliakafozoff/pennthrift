import { useState } from 'react';
import Form from '../components/Form';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/http';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Get intended destination or default to /profile
    const from = location.state?.from?.pathname || '/profile';
    
    async function handleLogin(username, password) {
        // Validate inputs
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        
        // Clear previous errors and set loading
        setError('');
        setLoading(true);
        
        try {
            const res = await api.post('/api/auth/login', {
                username,
                password,
                email: username
            });
            
            // Success - navigate immediately
            if (res.status === 200) {
                navigate(from, { replace: true });
            } 
            // Account locked
            else if (res.status === 202) {
                setError('Your account is locked. Please try again later.');
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            const statusCode = err.response?.status;
            
            if (statusCode === 429) {
                setError('Too many login attempts. Please wait a moment and try again.');
            } else if (statusCode === 401) {
                setError("Invalid username or password. Please try again.");
            } else {
                setError('Login failed. Please check your connection and try again.');
            }
        }
    }
    
    return (
        <div className='grid grid-main justify-center w-full h-full items-center'>
            <div className='col-span-8 flex flex-col justify-center'>
                <div className='my-5 text-center text-5xl'>Welcome back!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                <Form
                    userDetails={handleLogin}
                    reset={() => setError('')}
                    error={error}
                    loading={loading}
                    name='Login'
                />
            </div>
        </div>
    );
};

export default Login;
