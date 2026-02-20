import { useNavigate } from 'react-router-dom';

const MessagingBlockedModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleCreateAccount = () => {
        onClose();
        navigate('/register');
    };

    const handleSignIn = () => {
        onClose();
        navigate('/login');
    };

    const handleContinueBrowsing = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    Messaging is available with an account
                </h2>
                <p className="text-base text-gray-600 mb-6">
                    To protect students from spam and keep conversations tied to a Penn identity, messaging requires signing in. Create an account to message sellers and receive replies.
                </p>
                
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleCreateAccount}
                        className="w-full px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors font-medium"
                    >
                        Create account
                    </button>
                    
                    <button
                        onClick={handleSignIn}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Sign in
                    </button>
                    
                    <button
                        onClick={handleContinueBrowsing}
                        className="text-sm text-gray-500 hover:text-gray-700 text-center py-2"
                    >
                        Continue browsing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessagingBlockedModal;

