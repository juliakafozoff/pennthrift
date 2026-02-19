import { useState } from 'react';
import Form from '../components/Form';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(username, password) {
        // Validate inputs
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        
        // Clear previous errors and set loading
        setError('');
        setLoading(true);
        
        try {
            const res = await api.post('/api/auth/register', {
                username,
                password
            });
            
            // Success - navigate immediately
            if (res.data === 'successful') {
                navigate('/profile', { replace: true });
            } else if (res.data && res.data.includes('Error')) {
                setError('Username has already been taken');
                setLoading(false);
            } else {
                setError('Registration failed. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            setError('Registration failed. Please check your connection and try again.');
        }
    }
    
    return (
        <div className='grid grid-main justify-center w-full h-full items-center'>
            <div className='col-span-8 flex flex-col justify-center'>
                <div className='my-5 text-center text-5xl'>Welcome!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                <Form
                    userDetails={handleRegister}
                    reset={() => setError('')}
                    error={error}
                    loading={loading}
                    name='Register'
                />
            </div>
        </div>
    );
};

export default Register;
