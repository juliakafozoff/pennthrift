const User = require('../models/user.model');
const Item = require('../models/item.model');
const Request = require('../models/request.model');
const router = require('express').Router();




router.route('/profile/views/:username').get((req, res) => {
    User.findOne({username: req.params.username}, {profile_views: 1})
    .then(user => res.json(user))
    .catch(err => res.status(400).json('Error! ' + err))
});

router.route('/profile/update/:username').put((req, res) => {
    User.findOneAndUpdate({username: req.params.username}, req.body)
    .then(user => res.json('Success! User analytics updated.'))
    .catch(err => res.status(400).json('Error! ' + err))
});

router.route('/item/views/:id').get((req, res) => {
    Item.findById(req.params.id)
    .then(item => res.status(200).json(item))
    .catch(err => res.status(400).json('Error! ' + err))
});
router.route('/item/views/:id').put((req, res) => {
    Item.findOneAndUpdate({_id:req.params.id}, req.body)
    .then(item => res.status(200).json(item))
    .catch(err => res.status(400).json('Error! ' + err))
});

// Get comprehensive seller analytics for a user
router.route('/seller/:username').get(async (req, res) => {
    try {
        const { username } = req.params;
        
        // Get user and their items
        const user = await User.findOne({username}).populate('items');
        if (!user) {
            return res.status(404).json('Error! User not found');
        }
        
        const items = user.items || [];
        const itemIds = items.map(item => item._id);
        
        // Count favorites per item (users who favorited each item)
        const allUsers = await User.find({}, {favourites: 1, username: 1});
        const favoritesCount = {};
        allUsers.forEach(u => {
            if (u.favourites && Array.isArray(u.favourites)) {
                u.favourites.forEach(favId => {
                    const favIdStr = favId.toString();
                    if (itemIds.some(id => id.toString() === favIdStr)) {
                        favoritesCount[favIdStr] = (favoritesCount[favIdStr] || 0) + 1;
                    }
                });
            }
        });
        
        // Count requests per item
        const requests = await Request.find({item: {$in: itemIds}});
        const requestsCount = {};
        requests.forEach(req => {
            const itemIdStr = req.item.toString();
            requestsCount[itemIdStr] = (requestsCount[itemIdStr] || 0) + 1;
        });
        
        // Calculate stats
        const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
        const totalFavorites = Object.values(favoritesCount).reduce((sum, count) => sum + count, 0);
        const totalRequests = requests.length;
        const activeItems = items.filter(item => item.available !== false).length;
        const soldItems = items.filter(item => item.available === false).length;
        
        // Enrich items with analytics data
        const itemsWithAnalytics = items.map(item => {
            const itemIdStr = item._id.toString();
            const favorites = favoritesCount[itemIdStr] || 0;
            const itemRequests = requestsCount[itemIdStr] || 0;
            const engagement = item.views > 0 
                ? ((favorites + itemRequests) / item.views * 100).toFixed(1)
                : 0;
            
            return {
                ...item.toObject(),
                favorites,
                requests: itemRequests,
                engagementRate: parseFloat(engagement)
            };
        });
        
        // Sort by engagement (favorites + requests)
        itemsWithAnalytics.sort((a, b) => {
            const aEngagement = (a.favorites || 0) + (a.requests || 0);
            const bEngagement = (b.favorites || 0) + (b.requests || 0);
            return bEngagement - aEngagement;
        });
        
        res.json({
            stats: {
                totalItems: items.length,
                activeItems,
                soldItems,
                totalViews,
                totalFavorites,
                totalRequests,
                averageEngagement: items.length > 0 
                    ? ((totalFavorites + totalRequests) / Math.max(totalViews, 1) * 100).toFixed(1)
                    : 0
            },
            items: itemsWithAnalytics,
            recentActivity: [] // Can be enhanced later with timestamps
        });
    } catch (err) {
        console.error('Error fetching seller analytics:', err);
        res.status(400).json('Error! ' + err.message);
    }
});

module.exports = router;