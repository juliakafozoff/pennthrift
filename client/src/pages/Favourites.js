import StoreItems from "../components/StoreItems";
import Header from "../components/Header";
import { Component } from "react";
import api from "../api/http";
import { getUserFavourites, getUserProfile } from "../api/ProfileAPI";
import { PageHeader, Card, Input, Badge } from "../components/ui";
import { formatUsername } from "../utils/usernameUtils";


export default class Favourites extends Component {

    state = {
        keyword:'',
        searchCategories:[],
        user:'',
        favourites:[],
        favourites2:[],
        processed:false,
        loading: false,
    }
    
    componentDidMount(){
        this.setUp()
    }

    refresh = async() => {
        const user = this.state.user;
        if(user){
            try {
                this.setState({loading: true});
                const favourites = await getUserFavourites(user);
                const favouritesSafe = Array.isArray(favourites) ? favourites : [];
                const favouriteIds = favouritesSafe.map(f => f?._id).filter(Boolean);
                this.setState({
                    favourites: favouritesSafe,
                    favourites2: favouriteIds,
                    loading: false
                });
            } catch (e) {
                console.error('Error refreshing favourites:', e);
                this.setState({loading: false});
            }
        }
    }

    async setUp(){
        try {
            // Get current user first
            let user = this.state.user;
            if(!user){
                const res = await api.get('/api/auth/user');
                user = res.data;
                this.setState({user: user});
            }
            
            // Only proceed if we have a user and haven't loaded favourites yet
            if(user && !this.state.processed && !this.state.loading){
                this.setState({loading: true});
                
                // For demo users, ensure default favorites exist before fetching (only on first load per session)
                const isDemoUser = user === 'demo' || (user && typeof user === 'object' && (user.username === 'demo' || user.isDemo === true));
                if (isDemoUser) {
                    const hasSeededThisSession = sessionStorage.getItem('demoFavoritesSeeded') === '1';
                    if (!hasSeededThisSession) {
                        try {
                            await api.post('/api/auth/demo/ensure-default-favorites', {}, { withCredentials: true });
                            sessionStorage.setItem('demoFavoritesSeeded', '1');
                        } catch (favError) {
                            console.error('Error ensuring default favorites:', favError);
                            // Continue even if ensure fails
                        }
                    }
                }
                
                // Fetch favourites
                const favourites = await getUserFavourites(user);
                const favouritesSafe = Array.isArray(favourites) ? favourites : [];
                const favouriteIds = favouritesSafe.map(f => f?._id).filter(Boolean);
                
                this.setState({
                    favourites: favouritesSafe,
                    favourites2: favouriteIds,
                    processed: true,
                    loading: false
                });
            }
        } catch (e) {
            console.error('Error in setUp:', e);
            this.setState({processed: true, loading: false});
        }
    }

    componentDidUpdate(prevProps, prevState){
        // Only refresh if user changed or if we need to reload
        if(prevState.user !== this.state.user && this.state.user && !this.state.processed){
            this.setUp();
        }
    }

    search(items){
        const itemsSafe = Array.isArray(items) ? items : [];
        if(itemsSafe.length === 0) return [];
        
        let searchedItems = []
        const keyword = this.state.keyword ? this.state.keyword.toLowerCase() : '';
        const searchCategories = Array.isArray(this.state.searchCategories) ? this.state.searchCategories : [];
        
        if(searchCategories.length > 0){
            itemsSafe.forEach( item => {
                if(item && item.category && searchCategories.includes(item.category)){
                    if(keyword && !searchedItems.includes(item) && item.name && item.name.toLowerCase().includes(keyword) ){
                        searchedItems.push(item)
                    }else if(!keyword && !searchedItems.includes(item)){
                        searchedItems.push(item)
                    }
                }
            })
        }
        if(keyword){
            itemsSafe.forEach( item => {
                if(item && item.name && item.name.toLowerCase().includes(keyword)){
                    if(searchCategories.length > 0 && !searchedItems.includes(item) && item.category && searchCategories.includes(item.category)){
                        searchedItems.push(item)
                    }else if(searchCategories.length === 0 && !searchedItems.includes(item) ){
                        searchedItems.push(item)
                    }
                }
            })
        }
        const searched = !!keyword || searchCategories.length > 0 ;
        return searchedItems.length > 0 || searched ? searchedItems : itemsSafe;
    }
    addSearchCategory(category){
        let searchCategories = [...this.state.searchCategories];
        if(searchCategories.includes(category)){
            searchCategories =  searchCategories.filter( (item) =>{
                return item !== category;
            });
            this.setState({searchCategories:searchCategories})
        }
        else{
            this.setState({searchCategories:[...searchCategories, category]})
        }
    }


    render(){
        
    const categories  = ['For Fun', 'Vehicle', 'Apparel', 'Tickets', 
                            'Furniture', 'Electronics', 'Books/ notes', 'Miscellaneous']

        const favouritesSafe = Array.isArray(this.state.favourites) ? this.state.favourites : [];
        const searchedItems = this.search(favouritesSafe);
        
        const displayUsername = this.state.user ? formatUsername(this.state.user) : '';
        const hasActiveFilters = this.state.keyword || (Array.isArray(this.state.searchCategories) && this.state.searchCategories.length > 0);
        const resultCount = searchedItems.length;
        
        return(
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PageHeader 
                        title={displayUsername ? `${displayUsername}'s Saved Items` : 'My Saved Items'}
                        subtitle={resultCount > 0 ? `${resultCount} ${resultCount === 1 ? 'item' : 'items'} found` : 'No saved items yet'}
                    />
                    
                    {/* Mobile Filter Bar */}
                    <div className="lg:hidden mb-6 space-y-4">
                        <Card>
                            <div className="space-y-4">
                                <Input
                                    type="text"
                                    placeholder="Search items..."
                                    value={this.state.keyword}
                                    onChange={(e) => this.setState({keyword: e.target.value})}
                                    className="w-full"
                                />
                                {hasActiveFilters && (
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]">
                                        {this.state.keyword && (
                                            <Badge variant="primary">
                                                "{this.state.keyword}"
                                                <button
                                                    onClick={() => this.setState({keyword: ''})}
                                                    className="ml-2 hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    aria-label="Remove keyword filter"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        {Array.isArray(this.state.searchCategories) && this.state.searchCategories.map(cat => (
                                            <Badge key={cat} variant="primary">
                                                {cat}
                                                <button
                                                    onClick={() => this.addSearchCategory(cat)}
                                                    className="ml-2 hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    aria-label={`Remove ${cat} filter`}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                        <button
                                            onClick={() => {
                                                this.setState({keyword: '', searchCategories: []});
                                            }}
                                            className="text-xs text-[var(--color-primary)] hover:underline px-3 py-2 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                        
                        {/* Mobile Categories */}
                        <details className="group">
                            <summary className="cursor-pointer list-none">
                                <Card className="hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[var(--color-text)]">Categories</span>
                                        <svg className="w-5 h-5 text-[var(--color-muted)] transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </Card>
                            </summary>
                            <Card className="mt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(catg => {
                                        const isSelected = Array.isArray(this.state.searchCategories) && this.state.searchCategories.includes(catg);
                                        return (
                                            <label
                                                key={catg}
                                                className="flex items-center cursor-pointer group min-h-[44px] px-3 py-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => this.addSearchCategory(catg)}
                                                    className="w-4 h-4 mr-2 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)] focus:ring-2"
                                                />
                                                <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                    {catg}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </Card>
                        </details>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Column - Filters (Desktop) */}
                        {favouritesSafe.length > 0 && (
                            <aside className="hidden lg:block lg:col-span-1">
                                <Card className="sticky top-24">
                                    <div className="space-y-6">
                                        {/* Search */}
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                                                Search
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Search items..."
                                                value={this.state.keyword}
                                                onChange={(e) => this.setState({keyword: e.target.value})}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Categories */}
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
                                                Categories
                                            </label>
                                            <div className="space-y-2">
                                                {categories.map(catg => {
                                                    const isSelected = Array.isArray(this.state.searchCategories) && this.state.searchCategories.includes(catg);
                                                    return (
                                                        <label
                                                            key={catg}
                                                            className="flex items-center cursor-pointer group min-h-[44px] px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => this.addSearchCategory(catg)}
                                                                className="w-4 h-4 mr-3 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)] focus:ring-2"
                                                            />
                                                            <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                                {catg}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Active Filters */}
                                        {hasActiveFilters && (
                                            <div className="pt-4 border-t border-[var(--color-border)]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-[var(--color-text)]">
                                                        Active Filters
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            this.setState({keyword: '', searchCategories: []});
                                                        }}
                                                        className="text-xs text-[var(--color-primary)] hover:underline"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {this.state.keyword && (
                                                        <Badge variant="primary">
                                                            "{this.state.keyword}"
                                                            <button
                                                                onClick={() => this.setState({keyword: ''})}
                                                                className="ml-2 hover:opacity-70"
                                                                aria-label="Remove keyword filter"
                                                            >
                                                                ×
                                                            </button>
                                                        </Badge>
                                                    )}
                                                    {Array.isArray(this.state.searchCategories) && this.state.searchCategories.map(cat => (
                                                        <Badge key={cat} variant="primary">
                                                            {cat}
                                                            <button
                                                                onClick={() => this.addSearchCategory(cat)}
                                                                className="ml-2 hover:opacity-70"
                                                                aria-label={`Remove ${cat} filter`}
                                                            >
                                                                ×
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </aside>
                        )}

                        {/* Right Column - Items Grid */}
                        <div className={favouritesSafe.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
                            {/* Loading State */}
                            {this.state.loading && (
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
                                        <p className="text-base text-[var(--color-muted)]">Loading your saved items...</p>
                                    </div>
                                </div>
                            )}

                            {/* Items Grid */}
                            {!this.state.loading && (
                                <StoreItems
                                    refresh={this.refresh}
                                    favourites={this.state.favourites2}
                                    user={this.state.user}
                                    data={searchedItems}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    
}

