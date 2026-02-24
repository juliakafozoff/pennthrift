import { useState } from 'react';
import Form from '../components/Form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';

const logoImg = require('../assets/logo.png');

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth, demoLogin } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    
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
        <div className="min-h-screen w-full bg-[var(--color-surface-2)] flex flex-col">
            {/* Back to Home - top-left, outside card */}
            <div className="flex-shrink-0 pt-4 pl-4 sm:pl-6">
                <Link 
                    to="/" 
                    className="inline-block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded"
                >
                    ← Back to Home
                </Link>
            </div>

            {/* Centered card */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-md)] p-6 sm:p-8">
                    {/* Brand: logo + wordmark */}
                    <div className="flex items-center justify-center gap-2.5 mb-6">
                        <img 
                            src={logoImg} 
                            alt="" 
                            className="h-9 w-9 object-contain"
                            aria-hidden
                        />
                        <span className="text-xl font-semibold text-[var(--color-text)]">PennThrift</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-center text-[var(--color-text)] mb-1">Welcome back!</h1>
                    <p className="text-sm text-[var(--color-muted)] text-center mb-6">Log in to buy, sell, and message Penn students.</p>

                    {/* Login form (primary flow) */}
                    <Form
                        userDetails={handleLogin}
                        reset={() => setError('')}
                        error={error}
                        loading={loading}
                        name="Login"
                        variant="login"
                    />

                    {/* Demo: secondary below form */}
                    <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={handleDemoLogin}
                            disabled={demoLoading || loading}
                            className="w-full"
                            aria-label="Try demo account"
                        >
                            {demoLoading ? 'Loading...' : 'Try demo'}
                        </Button>
                        <p className="mt-2 text-xs text-[var(--color-muted)] text-center">Uses a sample account — no password needed.</p>
                    </div>

                    {/* Register link */}
                    <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
                        Don&apos;t have an account?{' '}
                        <Link 
                            to="/register" 
                            className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
