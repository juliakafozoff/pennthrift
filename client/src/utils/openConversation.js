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
    
    if (isDemo && targetUserId !== 'franklindesk') {
        // Demo user: navigate to draft thread (no server conversation)
        // Allow demo to message franklindesk normally
        navigate(`/profile/messages?draftTo=${targetUserId}`);
    } else {
        // Real user: navigate immediately, then fetch/create conversation
        // Don't wait for socket - navigate first, then handle conversation in Messages page
        navigate(`/profile/messages?startConversation=${targetUserId}`);
    }
};

