/**
 * Normalize image URLs for display
 * Handles relative paths, localhost URLs, 127.0.0.1, and already valid URLs
 */
export const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // If it's a relative path (starts with /api), prefix with API base URL
    if (url.startsWith('/api/')) {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://pennthrift.onrender.com';
        return `${apiBaseUrl}${url}`;
    }
    
    // Handle localhost or 127.0.0.1 URLs - extract relative path and normalize
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
        const productionUrl = process.env.REACT_APP_API_URL || 'https://pennthrift.onrender.com';
        const urlMatch = url.match(/\/api\/file\/(.+?)(?:[?#]|$)/);
        if (urlMatch) {
            const filename = urlMatch[1];
            // URL encode spaces and special characters
            const encodedFilename = encodeURIComponent(filename);
            return `${productionUrl}/api/file/${encodedFilename}`;
        }
        // If no match found, treat as invalid and return null
        return null;
    }
    
    // Already a valid absolute URL (not localhost)
    return url;
};

/**
 * Get user's first initial for fallback avatar
 */
export const getUserInitial = (username) => {
    if (!username || typeof username !== 'string') return '?';
    return username.charAt(0).toUpperCase();
};

