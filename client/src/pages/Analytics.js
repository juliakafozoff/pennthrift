import Header from "../components/Header";
import { useState, useEffect } from "react";
import api from "../api/http";
import { getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_item.png';
import { normalizeImageUrl } from "../utils/imageUtils";
import { Card, Badge } from "../components/ui";
import { Link } from "react-router-dom";






const Analytics = props => {
    const [user, setUser] = useState('');
    const [stats, setStats] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                // Get current user
                const res = await api.get('/api/auth/user');
                const username = res.data;
                setUser(username);
                
                // Get analytics data
                const analyticsRes = await api.get(`/api/analytics/seller/${username}`);
                setStats(analyticsRes.data.stats);
                setItems(analyticsRes.data.items || []);
                setLoading(false);
            } catch (error) {
                console.error('Error loading analytics:', error);
                setLoading(false);
            }
        };
        
        loadAnalytics();
    }, []);


    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <svg 
                                className="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto mb-4" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-base text-[var(--color-muted)]">Loading analytics...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statsSafe = stats || {};
    const itemsSafe = Array.isArray(items) ? items : [];

    return(
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Header/>
            <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
                        Seller Dashboard
                    </h1>
                    <p className="text-[var(--color-muted)]">
                        Track your listings performance and engagement
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="p-6">
                        <div className="text-sm font-medium text-[var(--color-muted)] mb-1">
                            Active Listings
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-text)]">
                            {statsSafe.activeItems || 0}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-1">
                            {statsSafe.soldItems || 0} sold
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm font-medium text-[var(--color-muted)] mb-1">
                            Total Views
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-text)]">
                            {statsSafe.totalViews || 0}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-1">
                            Across all items
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm font-medium text-[var(--color-muted)] mb-1">
                            Items Favorited
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-text)]">
                            {statsSafe.totalFavorites || 0}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-1">
                            Total favorites received
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm font-medium text-[var(--color-muted)] mb-1">
                            Requests Received
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-text)]">
                            {statsSafe.totalRequests || 0}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-1">
                            Buyer inquiries
                        </div>
                    </Card>
                </div>

                {/* Engagement Rate */}
                {statsSafe.averageEngagement && (
                    <Card className="p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-[var(--color-muted)] mb-1">
                                    Average Engagement Rate
                                </div>
                                <div className="text-2xl font-bold text-[var(--color-primary)]">
                                    {statsSafe.averageEngagement}%
                                </div>
                                <div className="text-xs text-[var(--color-muted)] mt-1">
                                    (Favorites + Requests) / Views
                                </div>
                            </div>
                            <div className="text-6xl opacity-20">
                                📈
                            </div>
                        </div>
                    </Card>
                )}

                {/* Top Performing Items */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-4">
                        Top Performing Items
                    </h2>
                    
                    {itemsSafe.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="text-[var(--color-muted)] mb-4">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-[var(--color-text)] mb-2">
                                No items listed yet
                            </p>
                            <p className="text-[var(--color-muted)] mb-4">
                                Start listing items to see your analytics here
                            </p>
                            <Link 
                                to="/profile/newitem"
                                className="inline-block px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                List Your First Item
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {itemsSafe.slice(0, 6).map((item) => {
                                if (!item || !item._id) return null;
                                
                                const engagementRate = item.engagementRate || 0;
                                const favorites = item.favorites || 0;
                                const requests = item.requests || 0;
                                const views = item.views || 0;
                                
                                return (
                                    <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <Link to={`/store/item/${item._id}`} className="block">
                                            <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-2)]">
                                                <img 
                                                    className="w-full h-full object-cover"
                                                    src={item.image ? normalizeImageUrl(item.image) : placeholder}
                                                    alt={item.name || 'Item'}
                                                    onError={(e) => {
                                                        e.target.src = placeholder;
                                                    }}
                                                />
                                                {item.available === false && (
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="default" className="bg-red-500 text-white">
                                                            Sold
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="p-4 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-[var(--color-text)] mb-1 line-clamp-2">
                                                    {item.name || 'Untitled'}
                                                </h3>
                                                {item.category && (
                                                    <Badge variant="default" className="text-xs">
                                                        {item.category}
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            {/* Engagement Metrics */}
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="text-center p-2 bg-[var(--color-surface-2)] rounded">
                                                    <div className="font-semibold text-[var(--color-text)]">{views}</div>
                                                    <div className="text-[var(--color-muted)]">Views</div>
                                                </div>
                                                <div className="text-center p-2 bg-[var(--color-surface-2)] rounded">
                                                    <div className="font-semibold text-[var(--color-text)]">❤️ {favorites}</div>
                                                    <div className="text-[var(--color-muted)]">Favs</div>
                                                </div>
                                                <div className="text-center p-2 bg-[var(--color-surface-2)] rounded">
                                                    <div className="font-semibold text-[var(--color-text)]">💬 {requests}</div>
                                                    <div className="text-[var(--color-muted)]">Reqs</div>
                                                </div>
                                            </div>
                                            
                                            {/* Engagement Rate */}
                                            {views > 0 && (
                                                <div className="pt-2 border-t border-[var(--color-border)]">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-[var(--color-muted)]">Engagement</span>
                                                        <span className="font-semibold text-[var(--color-primary)]">
                                                            {engagementRate}%
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                                            style={{ width: `${Math.min(engagementRate, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {item.price && (
                                                <div className="text-lg font-semibold text-[var(--color-primary)]">
                                                    ${parseFloat(item.price).toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* All Items List (if more than 6) */}
                {itemsSafe.length > 6 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-4">
                            All Items
                        </h2>
                        <Card className="overflow-hidden">
                            <div className="divide-y divide-[var(--color-border)]">
                                {itemsSafe.map((item) => {
                                    if (!item || !item._id) return null;
                                    
                                    const favorites = item.favorites || 0;
                                    const requests = item.requests || 0;
                                    const views = item.views || 0;
                                    const engagementRate = item.engagementRate || 0;
                                    
                                    return (
                                        <Link 
                                            key={item._id}
                                            to={`/store/item/${item._id}`}
                                            className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
                                        >
                                            <img 
                                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                src={item.image ? normalizeImageUrl(item.image) : placeholder}
                                                alt={item.name || 'Item'}
                                                onError={(e) => {
                                                    e.target.src = placeholder;
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-[var(--color-text)] truncate">
                                                        {item.name || 'Untitled'}
                                                    </h3>
                                                    {item.available === false && (
                                                        <Badge variant="default" className="bg-red-500 text-white text-xs">
                                                            Sold
                                                        </Badge>
                                                    )}
                                                </div>
                                                {item.category && (
                                                    <Badge variant="default" className="text-xs mb-2">
                                                        {item.category}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-center">
                                                    <div className="font-semibold text-[var(--color-text)]">{views}</div>
                                                    <div className="text-[var(--color-muted)] text-xs">Views</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-semibold text-[var(--color-text)]">❤️ {favorites}</div>
                                                    <div className="text-[var(--color-muted)] text-xs">Favs</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-semibold text-[var(--color-text)]">💬 {requests}</div>
                                                    <div className="text-[var(--color-muted)] text-xs">Reqs</div>
                                                </div>
                                                {views > 0 && (
                                                    <div className="text-center min-w-[60px]">
                                                        <div className="font-semibold text-[var(--color-primary)]">
                                                            {engagementRate}%
                                                        </div>
                                                        <div className="text-[var(--color-muted)] text-xs">Engage</div>
                                                    </div>
                                                )}
                                                {item.price && (
                                                    <div className="text-right min-w-[80px]">
                                                        <div className="font-semibold text-[var(--color-primary)]">
                                                            ${parseFloat(item.price).toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}


export default Analytics;