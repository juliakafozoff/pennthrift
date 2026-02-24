/**
 * Opens conversation UI for a target user
 * - Guests: Shows auth modal
 * - Demo users: Same as real users — create/open real conversation; send is blocked with modal
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
    
    // Demo and real users: create/open conversation via startConversation; demo will see modal on send
    navigate(`/profile/messages?startConversation=${targetUserId}`);
};

