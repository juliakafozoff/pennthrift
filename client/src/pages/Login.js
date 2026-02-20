import { useState } from 'react';
import Form from '../components/Form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth, demoLogin } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    
    // Get intended destination or default to /profile
    const from = location.state?.from?.pathname || '/profile';

    const handleDemoLogin = async () => {
        setDemoLoading(true);
        setError('');
        try {
            await demoLogin();
            navigate(from, { replace: true });
        } catch (err) {
            setError('Demo login failed. Please try again.');
            setDemoLoading(false);
        }
    };
    
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
            console.log('🔵 [LOGIN] Starting login request...');
            console.log('🔵 [LOGIN] Cookies before request:', document.cookie || 'NO COOKIES');
            
            const res = await api.post('/api/auth/login', {
                username,
                password,
                email: username
            });
            
            console.log('[LOGIN] status', res.status, 'data', res.data);
            
            // Robust success check: accept 200 with either { success: true } or { data: 'success' }
            const ok = res.status === 200 && (res.data?.success === true || res.data?.data === 'success');
            console.log('[LOGIN] ok?', ok);
            
            if (ok) {
                // Update auth context (this will call /api/auth/me)
                const authResult = await checkAuth(true); // Force refresh after login
                console.log('[LOGIN] Auth context updated:', authResult);
                
                const target = from;
                console.log('[LOGIN] navigating to', target);
                
                // Check cookie status before navigating
                const checkCookie = () => {
                    const hasCookie = document.cookie.includes('user_sid');
                    console.log('🟡 [LOGIN] Cookie check before navigation:', {
                        hasCookie,
                        allCookies: document.cookie || 'NO COOKIES',
                        cookieIncludesUserSid: document.cookie.includes('user_sid')
                    });
                    
                    if (!hasCookie) {
                        console.warn('⚠️ [LOGIN] WARNING: user_sid cookie not found before navigation!');
                    }
                    
                    navigate(target, { replace: true });
                };
                
                // Small delay to ensure cookie is set before navigation
                setTimeout(checkCookie, 300);
            } 
            // Account locked
            else if (res.status === 202) {
                setError('Your account is locked. Please try again later.');
                setLoading(false);
            } else {
                // Unexpected response
                setError('Login failed. Please try again.');
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
                {/* Back to Home link */}
                <Link 
                    to="/" 
                    className="self-start mb-4 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                    ← Back to Home
                </Link>
                
                <div className='my-5 text-center text-5xl'>Welcome back!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                
                {/* Try Demo button */}
                <div className='mb-6'>
                    <Button
                        variant="primary"
                        onClick={handleDemoLogin}
                        disabled={demoLoading || loading}
                        className="w-full"
                    >
                        {demoLoading ? 'Loading...' : 'Try Demo'}
                    </Button>
                </div>
                
                <div className='relative my-6'>
                    <div className='absolute inset-0 flex items-center'>
                        <div className='w-full border-t border-gray-300'></div>
                    </div>
                    <div className='relative flex justify-center text-sm'>
                        <span className='px-2 bg-white text-gray-500'>Or</span>
                    </div>
                </div>
                
                <Form
                    userDetails={handleLogin}
                    reset={() => setError('')}
                    error={error}
                    loading={loading}
                    name='Login'
                />
                
                {/* Register link */}
                <div className='mt-6 text-center text-sm text-[var(--color-muted)]'>
                    Don't have an account?{' '}
                    <Link 
                        to="/register" 
                        className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
