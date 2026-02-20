import StoreItems from "../components/StoreItems";
import Header from "../components/Header";
import { Component } from "react";
import api from "../api/http";
import { getUserFavourites } from "../api/ProfileAPI";
import { PageHeader, Card, Input, Badge } from "../components/ui";
import AuthRequiredModal from "../components/AuthRequiredModal";
import AboutPopover from "../components/AboutPopover";


export default class Store extends Component {

    state = {
        items:[],
        keyword:'',
        searchCategories:[],
        user:'',
        processed:false,
        favourites:[],
        error: null,
        loading: true,
        showAuthModal: false,
        authModalCallback: null,
    }
    
    componentDidMount(){
        this.loadItems();
        this.setUp();
    }

    loadItems = () => {
        if(this.state.items.length === 0){
            api.get('/api/item/all')
                    .then( res => {
                        const itemsSafe = Array.isArray(res.data) ? res.data : [];
                        this.setState({items: itemsSafe, loading: false});
                    })
                    .catch(e => {
                        console.error('Error loading items:', e);
                        this.setState({items: [], loading: false, error: 'Failed to load items'});
                    });
        } else {
            this.setState({loading: false});
        }
    }

    async setUp(){
        try {
            let currentUser = this.state.user;
            const processed = this.state.processed;
            
            if(!currentUser && !processed ){
                const res = await api.get('/api/auth/user').catch(e => {
                    console.error('Error loading user:', e);
                    return {data: null};
                });
                currentUser = res.data;
                this.setState({user: currentUser, processed: true});
            }
            
            if(currentUser && this.state.favourites.length === 0){
                try {
                    const favourites = await getUserFavourites(currentUser);
                    const favouritesSafe = Array.isArray(favourites) ? favourites : [];
                    const favouriteIds = favouritesSafe.map(f => f?._id).filter(Boolean);
                    this.setState({favourites: favouriteIds.length > 0 ? favouriteIds : []});
                } catch (e) {
                    console.error('Error loading favourites:', e);
                    this.setState({favourites: []});
                }
            } else if (!currentUser && !processed) {
                this.setState({processed: true});
            }
        } catch (e) {
            console.error('Error in setUp:', e);
            this.setState({processed: true});
        }
    }

    refresh = async() => {
        const user = this.state.user;
        if(user){
            try {
                const favourites = await getUserFavourites(user);
                const favouritesSafe = Array.isArray(favourites) ? favourites : [];
                const favouriteIds = favouritesSafe.map(f => f?._id).filter(Boolean);
                this.setState({favourites: favouriteIds});
            } catch (e) {
                console.error('Error refreshing favourites:', e);
            }
        }
    }
    componentDidUpdate(){
        if(this.state.items.length === 0 && !this.state.loading){
            this.loadItems();
        }
        if(!this.state.processed){
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

    handleAuthRequired = (callback) => {
        this.setState({ showAuthModal: true, authModalCallback: callback });
    };

    handleAuthModalClose = () => {
        this.setState({ showAuthModal: false, authModalCallback: null });
    };

    handleAuthModalSuccess = () => {
        // Refresh user and favourites after successful auth
        this.setUp();
        if (this.state.authModalCallback) {
            this.state.authModalCallback();
        }
    };

    render(){
        const categories  = ['For Fun', 'Vehicle', 'Apparel', 'Tickets', 
                            'Furniture', 'Electronics', 'Books/ notes', 'Miscellaneous'];
        
        const itemsSafe = Array.isArray(this.state.items) ? this.state.items : [];
        const searchResults = this.search(itemsSafe);
        const searchResultsSafe = Array.isArray(searchResults) ? searchResults : [];
        const hasActiveFilters = this.state.keyword || (Array.isArray(this.state.searchCategories) && this.state.searchCategories.length > 0);
        const resultCount = searchResultsSafe.length;

        return(
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <AuthRequiredModal
                    isOpen={this.state.showAuthModal}
                    onClose={this.handleAuthModalClose}
                    onSuccess={this.handleAuthModalSuccess}
                />
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PageHeader 
                        title={
                            <span className="flex items-baseline">
                                Store
                                <AboutPopover trigger="hover">
                                    <button
                                        className="inline-flex items-center justify-center ml-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                                        aria-label="About PennThrift"
                                        style={{ fontSize: '14px', lineHeight: '1' }}
                                    >
                                        ⓘ
                                    </button>
                                </AboutPopover>
                            </span>
                        }
                        subtitle={resultCount > 0 ? `${resultCount} ${resultCount === 1 ? 'item' : 'items'} found` : 'Browse marketplace'}
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
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-[var(--color-text)]">Active filters</span>
                                                <button
                                                    onClick={() => {
                                                        this.setState({keyword: '', searchCategories: []});
                                                    }}
                                                    className="text-xs text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded"
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
                                                            className="ml-2 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] rounded"
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
                                                            className="ml-2 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] rounded"
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

                        {/* Right Column - Results */}
                        <main className="lg:col-span-3">
                            {this.state.loading && (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <svg 
                                        className="animate-spin h-8 w-8 text-[var(--color-primary)] mb-4" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-base text-[var(--color-muted)]">Loading items...</p>
                                </div>
                            )}
                            
                            {this.state.error && (
                                <Card className="border-[var(--color-danger)]">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-base text-[var(--color-danger)]">{this.state.error}</p>
                                    </div>
                                </Card>
                            )}
                            
                            {!this.state.loading && !this.state.error && this.state.processed && (
                                <StoreItems
                                    refresh={this.refresh}
                                    favourites={Array.isArray(this.state.favourites) ? this.state.favourites : []}
                                    user={this.state.user}
                                    data={searchResultsSafe}
                                    onAuthRequired={this.handleAuthRequired}
                                />
                            )}
                        </main>
                    </div>
                </div>
            </div>
        )
    }

    
}

