import api from "../api/http";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import StoreItems from '../components/StoreItems';
import placeholder from '../assets/placeholder_item.png';
import { getUserFavourites } from "../api/ProfileAPI";
import { normalizeImageUrl } from "../utils/imageUtils";
import { Card, Badge } from "../components/ui";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { useAuth } from "../contexts/AuthContext";
import { openConversationUI } from "../utils/openConversation";




const Item = props => {
    const { user: authUser } = useAuth();
    const [userInfo, setUserInfo]           = useState('');
    const [item, setItem]                   = useState({});
    const [viewer, setViewer]               = useState();
    const [viewed, setViewed]               = useState(false);
    const [favourites, setFavourites]       = useState([]);
    const [similarItems, setSimilarItems ]  = useState([]);
    const { id } = useParams();
    const [stateId, setStateId]             = useState(id);
    const [processed, setProcessed] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalCallback, setAuthModalCallback] = useState(null);
    const navigate = useNavigate()

    // Redirect to store if no ID provided
    useEffect(() => {
        if (!id) {
            navigate('/store', { replace: true });
        }
    }, [id, navigate]);

    const getInfo = async () => {
        if (!id) return; // Safety check
        
        if (!item || !viewer) {
            try {
                const resU = await api.get('/api/auth/user');
                setViewer(resU.data);
                const resI = await api.get(`/api/item/${id}`);
                setItem(resI.data)
            } catch (error) {
                console.error('Error loading item:', error);
                // Redirect to store if item not found
                navigate('/store', { replace: true });
            }
        }
        if(viewer && !viewed && id){
            setViewed(true)
            updateViews(id)
        }
    }

    const updateViews = async(id) => {
        const url = `/api/analytics/item/views/${id}`;
        const res = await api.get(url)
        let views = res.data.views + 1;
        api.put(url,{views:views})
    }
    
    // Load item data when component mounts or id changes
    useEffect(() => {
        if (id) {
            getInfo();
        }
    }, [id]);

    
    const update = async(id) =>{
        if(viewer){
            await api.post('/api/profile/favourites/update',{itemID:id, username:viewer})
            refresh()
        }else{
            setAuthModalCallback(() => () => {
                // After auth, retry the favorite action
                update(id);
            });
            setShowAuthModal(true);
        }
    }

    const handleAuthModalClose = () => {
        setShowAuthModal(false);
        setAuthModalCallback(null);
    };

    const handleAuthModalSuccess = async () => {
        // Refresh viewer after successful auth
        try {
            const resU = await api.get('/api/auth/user');
            setViewer(resU.data);
            await refresh();
        } catch (error) {
            console.error('Error refreshing user after auth:', error);
        }
        if (authModalCallback) {
            authModalCallback();
        }
    };
    
    const filter = (items) =>{
        let similar = []
        items.map( i => {
                
            if(i._id == item._id){
                return
            }
            if(i.owner == item.owner){
                similar.push(i)
                return
            }
            if(i.category == item.category){
                similar.push(i)
                return
            }
            
        } );
    
        return similar;
    }

    const fecthSimilar = () =>{
        if(similarItems.length === 0 ){
    
            api.get(`/api/item/all`)
                    .then( res => {setSimilarItems(filter(res.data))})
                    .catch(e => console.log(e))

        }
    }

    const refresh = async() => {
        if(viewer){
            try {
                const fav = await getUserFavourites(viewer);
                const favouritesSafe = Array.isArray(fav) ? fav : [];
                const favouriteIds = favouritesSafe.map(f => f?._id).filter(Boolean);
                setFavourites(favouriteIds);
            } catch (error) {
                console.error('Error refreshing favourites:', error);
            }
        }
    }

    async function setUp(){
        if(viewer && favourites.length == 0 && !processed){
            try {
                const fav = await getUserFavourites(viewer);
                const favouritesSafe = Array.isArray(fav) ? fav : [];
                const favouriteIds = favouritesSafe.map(f => f?._id).filter(Boolean);
                setFavourites(favouriteIds);
                setProcessed(true);
            } catch (error) {
                console.error('Error setting up favourites:', error);
                setProcessed(true);
            }
        }
    }

   
    useEffect(() => {
        
        if((stateId != id) && stateId){
            window.location.reload()
        }
        fecthSimilar();
        setUp();
    },[similarItems,id, item, viewer, viewed, favourites, stateId]);


    const favourite = (id) =>{
        if(favourites.includes(id)){
            return require('../assets/favourite_red.png')
        }
        return require('../assets/favourite.png')
    }


    if (!item || !item._id) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-6xl">
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
                            <p className="text-base text-[var(--color-muted)]">Loading item...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return(
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Header/>
            <AuthRequiredModal
                isOpen={showAuthModal}
                onClose={handleAuthModalClose}
                onSuccess={handleAuthModalSuccess}
            />
            <div className="container py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Item Details */}
                    <div className="lg:col-span-1">
                        <Card className="overflow-hidden">
                            <div className="aspect-square overflow-hidden bg-[var(--color-surface-2)] rounded-t-lg">
                                <img 
                                    src={item.image ? normalizeImageUrl(item.image) : placeholder} 
                                    alt={item.name || 'Item'}
                                    className='w-full h-full object-cover'
                                    onError={(e) => {
                                        e.target.src = placeholder;
                                    }}
                                />
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {/* Category Badge */}
                                {item.category && (
                                    <Badge variant="primary" className="text-sm">
                                        {item.category}
                                    </Badge>
                                )}
                                
                                {/* Item Name */}
                                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                                    {item.name || 'Untitled Item'}
                                </h1>
                                
                                {/* Price */}
                                <div className="text-3xl font-semibold text-[var(--color-primary)]">
                                    ${item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                                </div>
                                
                                {/* Description */}
                                {item.description && (
                                    <div className="pt-4 border-t border-[var(--color-border)]">
                                        <h2 className="text-sm font-medium text-[var(--color-muted)] mb-2">Description</h2>
                                        <p className="text-base text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                                            {item.description}
                                        </p>
                                    </div>
                                )}
                                
                                {/* Owner and Favorite */}
                                <div className='flex items-center justify-between pt-4 border-t border-[var(--color-border)]'>
                                    <Link 
                                        to={`/user/${item.owner}`} 
                                        className='text-[var(--color-primary)] hover:underline font-medium truncate max-w-[200px]'
                                    >
                                        @{item.owner}
                                    </Link>
                                    <button
                                        onClick={() => update(item._id)}
                                        className="p-2 hover:bg-[var(--color-surface-2)] rounded-lg transition-colors"
                                        aria-label={favourites.includes(item._id) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        <img 
                                            src={favourite(item._id)}  
                                            className='w-6 h-6'
                                            alt=""
                                        />
                                    </button>
                                </div>
                                
                                {/* Message Seller */}
                                {viewer !== item.owner && (
                                    <button
                                        onClick={() => openConversationUI(item.owner, {
                                            viewer,
                                            authUser: authUser || (viewer ? { username: viewer } : null),
                                            navigate,
                                            setShowAuthModal: (show) => {
                                                setAuthModalCallback(null);
                                                setShowAuthModal(show);
                                            }
                                        })}
                                        className="w-full py-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                                    >
                                        Message Seller
                                    </button>
                                )}
                            </div>
                        </Card>
                    </div>
                    
                    {/* Right Column - Similar Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6">
                                Similar Items
                            </h2>
                            <StoreItems 
                                favourites={favourites}
                                refresh={refresh}
                                user={viewer}
                                data={similarItems}
                                showEmptyState={true}
                                onAuthRequired={(callback) => {
                                    setAuthModalCallback(() => callback);
                                    setShowAuthModal(true);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Item;