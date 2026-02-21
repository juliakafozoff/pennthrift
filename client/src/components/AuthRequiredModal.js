import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui';

const AuthRequiredModal = ({ isOpen, onClose, onSuccess, title, body }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { demoLogin } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleTryDemo = async () => {
        setIsLoading(true);
        try {
            await demoLogin();
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            console.error('Demo login failed:', error);
            alert('Demo login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        onClose();
        navigate('/login');
    };

    const handleRegister = () => {
        onClose();
        navigate('/register');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    {title || 'Try the demo?'}
                </h2>
                <p className="text-base text-gray-600 mb-6">
                    {body || 'Log in to save items, post listings, and receive replies.'}
                </p>
                
                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        onClick={handleTryDemo}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Loading...' : 'Try Demo'}
                    </Button>
                    
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleLogin}
                            className="flex-1"
                        >
                            Log in
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleRegister}
                            className="flex-1"
                        >
                            Register
                        </Button>
                    </div>
                    
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700 text-center py-2"
                    >
                        Continue browsing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthRequiredModal;


