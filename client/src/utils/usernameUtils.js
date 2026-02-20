/**
 * Format username for display: capitalize first letter
 * Usernames are stored in lowercase, but displayed with capitalized first letter
 * 
 * @param {string} username - The username (may be lowercase or mixed case)
 * @returns {string} - Username with capitalized first letter (e.g., "julia" -> "Julia")
 */
export const formatUsername = (username) => {
    if (!username || typeof username !== 'string') {
        return '';
    }
    // Capitalize first letter, keep rest as-is (should already be lowercase from backend)
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
};

/**
 * Normalize username for API requests: convert to lowercase
 * 
 * @param {string} username - The username input
 * @returns {string} - Lowercase username
 */
export const normalizeUsername = (username) => {
    if (!username || typeof username !== 'string') {
        return '';
    }
    return username.trim().toLowerCase();
};

