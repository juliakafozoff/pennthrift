import api from "../api/http";
import { Component } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import ProfileListings from "../components/ProfileListings";
import { getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_user.png';
import { PageHeader, Card, Badge, Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";


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
        // Only reload if auth user changes (e.g., after login/logout)
        const prevUser = prevProps.auth?.user?.username;
        const currentUser = this.props.auth?.user?.username;
        
        if (prevUser !== currentUser) {
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
        
        try {
            // First, get the current authenticated user from session (canonical source)
            console.log('[PROFILE] Fetching current authenticated user from /api/auth/me');
            const meRes = await api.get('/api/auth/me');
            console.log('[PROFILE] /api/auth/me response:', meRes.data);
            
            if (!meRes.data.authenticated || !meRes.data.user) {
                console.log('[PROFILE] Not authenticated, redirecting to login');
                // Not authenticated - ProtectedRoute should handle this, but ensure we don't load data
                this.setState({ dataLoaded: true });
                return;
            }
            
            const currentUser = meRes.data.user;
            const username = currentUser.username;
            const userId = currentUser.id;
            
            console.log('[PROFILE] Current authenticated user:', { username, userId });
            console.log('[PROFILE] Fetching profile for:', username, '(from /api/auth/me)');
            
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
        } catch (error) {
            console.error('[PROFILE] Error fetching /api/auth/me:', error);
            this.setState({ dataLoaded: true });
        }
    }

    processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        this.setState({bio:bio, year:class_year, venmo:venmo, profile_pic:profile_pic});
        if(interests)this.setState({interests:interests});
    }

    refresh = async () => {
        try {
            // Get current authenticated user from session
            const meRes = await api.get('/api/auth/me');
            if (meRes.data.authenticated && meRes.data.user) {
                const username = meRes.data.user.username;
                console.log('[PROFILE] Refreshing items for:', username);
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
        } catch (error) {
            console.error('[PROFILE] Error fetching /api/auth/me for refresh:', error);
        }
    }

    render(){
        const user = this.props.auth?.user?.username || 'Profile';
        
        return(
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Profile Info */}
                        <div className="lg:col-span-1">
                            <Card className="text-center lg:text-left">
                                <img
                                    className="w-48 h-48 rounded-full mx-auto lg:mx-0 mb-6 object-cover border-4 border-[var(--color-surface-2)]" 
                                    src={this.state.profile_pic || placeholder}
                                    alt={user}
                                />
                                
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
                                    
                                    {/* Edit Profile Button - Prominent placement */}
                                    <div className="pt-4 border-t border-[var(--color-border)]">
                                        <Link to="/profile/edit" className="block [&_button]:!text-white">
                                            <Button variant="primary" className="w-full">
                                                Edit Profile
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - Listings */}
                        <div className="lg:col-span-2 space-y-6">
                            <PageHeader
                                title={user}
                                subtitle={this.state.venmo && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <img className="w-5 h-5" src={require('../assets/vimeo.png')} alt="Venmo" />
                                        <span className="text-base text-[var(--color-text)]">{this.state.venmo}</span>
                                    </div>
                                )}
                                actions={
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link to="/profile/analytics" className="[&_button]:!text-[var(--color-text)]">
                                            <Button variant="secondary">
                                                View Analytics
                                            </Button>
                                        </Link>
                                        <Link to="/profile/edit" className="hidden lg:block [&_button]:!text-white">
                                            <Button variant="primary">
                                                Edit Profile
                                            </Button>
                                        </Link>
                                    </div>
                                }
                            />
                            
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Your listings</h2>
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