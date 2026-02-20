import api from "../api/http";
import { Component } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import ProfileListings from "../components/ProfileListings";
import { getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_user.png';
import { PageHeader, Card, Badge, Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { normalizeImageUrl, getUserInitial } from "../utils/imageUtils";
import { formatUsername } from "../utils/usernameUtils";
import { VenmoIcon } from "../components/icons";


class Profile extends Component {
    

    state = {
        items:[],
        bio:'',
        profile_pic:'',
        venmo:'',
        year:'',
        processed:false,
        userInfo:'',
        interests:[],
        dataLoaded: false, // Track if initial data load is complete
    }
    
    componentDidMount(){
        this.loadProfileData();
    }

    componentDidUpdate(prevProps){
        // Only reload if auth user changes (e.g., after login/logout or username change)
        const prevUser = prevProps.auth?.user?.username;
        const currentUser = this.props.auth?.user?.username;
        
        // Use case-insensitive comparison to catch username changes (e.g., "julia" -> "Julia")
        const userChanged = prevUser !== currentUser || 
            (prevUser && currentUser && prevUser.toLowerCase() !== currentUser.toLowerCase());
        
        if (userChanged) {
            // Reset state and reload if user changed
            this.setState({
                items: [],
                processed: false,
                userInfo: '',
                dataLoaded: false
            });
            this.loadProfileData();
        }
    }

    loadProfileData = async () => {
        const { items, processed, userInfo, dataLoaded } = this.state;
        
        // Don't reload if already loaded
        if (dataLoaded) return;
        
        // Use auth context user instead of making separate /api/auth/me call
        const authUser = this.props.auth?.user;
        
        if (!authUser || !authUser.username) {
            console.log('[PROFILE] No authenticated user in context, waiting for auth...');
            // If auth context is still loading, wait a bit
            if (this.props.auth?.isLoading) {
                return; // Will retry when auth context updates
            }
            // Not authenticated - ProtectedRoute should handle this
            this.setState({ dataLoaded: true });
            return;
        }
        
        const username = authUser.username;
        const userId = authUser.id;
        
        console.log('[PROFILE] Current authenticated user:', { username, userId }, '(from auth context)');
        console.log('[PROFILE] Fetching profile for:', username);
        
        // Load items if empty
        if (items.length === 0) {
            api.get(`/api/profile/items/${username}`)
                .then(res => {
                    console.log('[PROFILE] Items loaded for:', username);
                    this.setState({
                        items: Array.isArray(res.data?.items) ? res.data.items.reverse() : [],
                        dataLoaded: true
                    });
                })
                .catch(e => {
                    console.error('[PROFILE] Error loading items:', e);
                    this.setState({ items: [], dataLoaded: true });
                });
        }
        
        // Load user profile info if not loaded
        if (!userInfo) {
            getUserProfile(username)
                .then(info => {
                    console.log('[PROFILE] Profile info loaded for:', username);
                    this.setState({ userInfo: info });
                    if (info && !processed) {
                        this.processUserInfo(info);
                        this.setState({ processed: true });
                    }
                })
                .catch(e => {
                    console.error('[PROFILE] Error loading profile:', e);
                    this.setState({ dataLoaded: true });
                });
        } else if (userInfo && !processed) {
            this.processUserInfo(userInfo);
            this.setState({ processed: true });
        }
    }

    processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        this.setState({bio:bio, year:class_year, venmo:venmo, profile_pic:profile_pic});
        if(interests)this.setState({interests:interests});
    }

    refresh = () => {
        // Use auth context user instead of making separate /api/auth/me call
        const authUser = this.props.auth?.user;
        if (authUser && authUser.username) {
            const username = authUser.username;
            console.log('[PROFILE] Refreshing items for:', username, '(from auth context)');
            api.get(`/api/profile/items/${username}`)
                .then(res => {
                    this.setState({
                        items: Array.isArray(res.data?.items) ? res.data.items.reverse() : []
                    });
                })
                .catch(e => {
                    console.error('[PROFILE] Error refreshing items:', e);
                });
        }
    }

    render(){
        const rawUsername = this.props.auth?.user?.username || 'Profile';
        const displayUsername = formatUsername(rawUsername);
        
        return(
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Profile Info */}
                        <div className="lg:col-span-1">
                            <Card className="text-center lg:text-left">
                                {this.state.profile_pic && normalizeImageUrl(this.state.profile_pic) ? (
                                    <>
                                        <img
                                            className="w-48 h-48 rounded-full mx-auto lg:mx-0 mb-6 object-cover border-4 border-[var(--color-surface-2)]" 
                                            src={normalizeImageUrl(this.state.profile_pic)}
                                            alt={displayUsername}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallback = e.target.nextSibling;
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                        <div 
                                            className="w-48 h-48 rounded-full mx-auto lg:mx-0 mb-6 border-4 border-[var(--color-surface-2)] bg-gray-600 flex items-center justify-center text-white text-6xl font-semibold"
                                            style={{ display: 'none' }}
                                        >
                                            {getUserInitial(rawUsername)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-48 h-48 rounded-full mx-auto lg:mx-0 mb-6 border-4 border-[var(--color-surface-2)] bg-gray-600 flex items-center justify-center text-white text-6xl font-semibold">
                                        {getUserInitial(rawUsername)}
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    {this.state.year && (
                                        <div>
                                            <span className="text-sm text-[var(--color-muted)]">Graduating Class</span>
                                            <p className="text-base font-medium text-[var(--color-text)] mt-1">{this.state.year}</p>
                                        </div>
                                    )}
                                    
                                    {Array.isArray(this.state.interests) && this.state.interests.length > 0 && (
                                        <div>
                                            <span className="text-sm text-[var(--color-muted)] block mb-2">Interests</span>
                                            <div className="flex flex-wrap gap-2">
                                                {this.state.interests.map((intr, index) => (
                                                    <Badge key={index} variant="primary">
                                                        {intr}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {this.state.bio && (
                                        <div className="pt-4 border-t border-[var(--color-border)]">
                                            <span className="text-sm text-[var(--color-muted)] block mb-2">Bio</span>
                                            <p className="text-sm text-[var(--color-text)] leading-relaxed">{this.state.bio}</p>
                                        </div>
                                    )}
                                    
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - Listings */}
                        <div className="lg:col-span-2 space-y-6">
                            <PageHeader
                                title={displayUsername}
                                subtitle={this.state.venmo && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <VenmoIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-base text-[var(--color-text)]">{this.state.venmo}</span>
                                    </div>
                                )}
                                actions={
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link to="/profile/analytics">
                                            <Button variant="secondary" className="text-sm">
                                                View Analytics
                                            </Button>
                                        </Link>
                                        <Link to="/profile/edit">
                                            <Button variant="primary">
                                                Edit Profile
                                            </Button>
                                        </Link>
                                    </div>
                                }
                            />
                            
                            <div>
                                <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6">Your listings</h2>
                                <ProfileListings
                                    refresh={this.refresh}
                                    data={this.state.items}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    

    

}

// HOC to inject auth context
const ProfileWithAuth = (props) => {
    const auth = useAuth();
    return <Profile {...props} auth={auth} />;
};

export default ProfileWithAuth;