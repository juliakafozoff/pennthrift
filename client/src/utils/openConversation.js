import { isDemoUser } from './messagingGuard';

/**
 * Opens conversation UI for a target user
 * - Guests: Shows auth modal
 * - Demo users: Opens draft thread (no server conversation created)
 * - Real users: Creates/fetches real conversation
 */
export const openConversationUI = (targetUserId, context) => {
    const { viewer, authUser, navigate, setShowAuthModal, setShowMessagingBlockedModal, socketRef } = context;
    
    // If not logged in, show auth modal
    if (!viewer && !authUser) {
        if (setShowAuthModal) {
            setShowAuthModal(true);
        } else {
            navigate('/login');
        }
        return;
    }
    
    // Check if user is demo
    const user = authUser || viewer;
    const isDemo = isDemoUser(user);
    
    if (isDemo) {
        // Demo user: navigate to draft thread (no server conversation)
        navigate(`/profile/messages?draftTo=${targetUserId}`);
    } else {
        // Real user: create/fetch real conversation
        if (socketRef && socketRef.current) {
            const users = [user.username || user, targetUserId];
            
            socketRef.current.emit('get-open', users);
            socketRef.current.on('message-navigate', id => {
                const chatId = typeof id === 'string' ? id : String(id);
                if (chatId && chatId !== '[object Object]' && chatId !== 'undefined') {
                    navigate(`/profile/messages/${chatId}`);
                }
            });
        } else {
            // Fallback: navigate to messages page
            navigate(`/profile/messages?draftTo=${targetUserId}`);
        }
    }
};

