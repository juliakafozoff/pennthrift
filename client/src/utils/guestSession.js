/**
 * Guest session utilities for demo/trial messaging
 */

const GUEST_SESSION_KEY = 'pennthrift_guest_session';
const GUEST_MESSAGE_COUNT_KEY = 'pennthrift_guest_message_count';
const GUEST_MESSAGE_LIMIT = 3;

/**
 * Get or create guest session ID
 */
export const getGuestSessionId = () => {
    if (typeof window === 'undefined') return null;
    
    let sessionId = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!sessionId) {
        // Generate a simple session ID
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(GUEST_SESSION_KEY, sessionId);
    }
    return sessionId;
};

/**
 * Get current guest message count
 */
export const getGuestMessageCount = () => {
    if (typeof window === 'undefined') return 0;
    const count = sessionStorage.getItem(GUEST_MESSAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
};

/**
 * Increment guest message count
 */
export const incrementGuestMessageCount = () => {
    if (typeof window === 'undefined') return 0;
    const current = getGuestMessageCount();
    const newCount = current + 1;
    sessionStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString());
    return newCount;
};

/**
 * Check if guest has reached message limit
 */
export const hasReachedGuestLimit = () => {
    return getGuestMessageCount() >= GUEST_MESSAGE_LIMIT;
};

/**
 * Reset guest message count (after authentication)
 */
export const resetGuestMessageCount = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
    sessionStorage.removeItem(GUEST_SESSION_KEY);
};

/**
 * Get remaining guest messages
 */
export const getRemainingGuestMessages = () => {
    const count = getGuestMessageCount();
    return Math.max(0, GUEST_MESSAGE_LIMIT - count);
};


