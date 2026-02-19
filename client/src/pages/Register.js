import { useState } from 'react';
import Form from '../components/Form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/http';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
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
            
            console.log('[REGISTER] status', res.status, 'data', res.data);
            
            // Robust success check: accept 200 with either { success: true }, { data: 'success' }, or res.data === 'successful'
            const ok = res.status === 200 && (
                res.data?.success === true || 
                res.data?.data === 'success' || 
                res.data === 'successful'
            );
            console.log('[REGISTER] ok?', ok);
            
            if (ok) {
                // Update auth context (force refresh after registration)
                await checkAuth(true);
                
                const target = '/profile';
                console.log('[REGISTER] navigating to', target);
                
                // Small delay to ensure cookie is set before navigation
                setTimeout(() => {
                    navigate(target, { replace: true });
                }, 300);
            } else if (res.data && typeof res.data === 'string' && res.data.includes('Error')) {
                setError('Username has already been taken');
                setLoading(false);
            } else {
                setError('Registration failed. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            const statusCode = err.response?.status;
            
            if (statusCode === 409) {
                setError('Username has already been taken');
            } else {
                setError('Registration failed. Please check your connection and try again.');
            }
        }
    }
    
    return (
        <div className='grid grid-main justify-center w-full h-full items-center'>
            <div className='col-span-8 flex flex-col justify-center'>
                {/* Back to Home link */}
                <Link 
                    to="/" 
                    className="self-start mb-4 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                    ← Back to Home
                </Link>
                
                <div className='my-5 text-center text-5xl'>Welcome!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                <Form
                    userDetails={handleRegister}
                    reset={() => setError('')}
                    error={error}
                    loading={loading}
                    name='Register'
                />
                
                {/* Login link */}
                <div className='mt-6 text-center text-sm text-[var(--color-muted)]'>
                    Already have an account?{' '}
                    <Link 
                        to="/login" 
                        className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
