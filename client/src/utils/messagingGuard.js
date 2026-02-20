/**
 * Guard function to check if user can send messages
 * Returns true if user can message, false if blocked (demo user)
 */
export const requireAuthForMessaging = (user) => {
    if (!user) return false;
    
    // Check if user is demo user
    const isDemoUser = user.username === 'demo' || user.isDemo === true;
    
    // Demo users cannot message real users
    return !isDemoUser;
};

/**
 * Check if user is demo user
 */
export const isDemoUser = (user) => {
    if (!user) return false;
    return user.username === 'demo' || user.isDemo === true;
};

