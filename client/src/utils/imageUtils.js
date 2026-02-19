/**
 * Normalize image URLs for display
 * Handles relative paths, localhost URLs, and already valid URLs
 */
export const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // If it's a relative path (starts with /api), prefix with API base URL
    if (url.startsWith('/api/')) {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        return `${apiBaseUrl}${url}`;
    }
    
    // Backward compatibility: replace localhost URLs with production URL
    if (url.includes('localhost')) {
        const productionUrl = process.env.REACT_APP_API_URL || 'https://pennthrift.onrender.com';
        const urlMatch = url.match(/\/api\/file\/(.+)$/);
        if (urlMatch) {
            const filename = urlMatch[1];
            // URL encode spaces and special characters
            const encodedFilename = encodeURIComponent(filename);
            return `${productionUrl}/api/file/${encodedFilename}`;
        }
        // Fallback: replace localhost host with production host
        return url.replace(/https?:\/\/[^\/]+/, productionUrl);
    }
    
    // Already a valid absolute URL
    return url;
};

