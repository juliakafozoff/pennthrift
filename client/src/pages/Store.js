import StoreItems from "../components/StoreItems";
import { Component } from "react";
import api from "../api/http";
import { getUserFavourites } from "../api/ProfileAPI";
import { PageHeader, Card, Input, Badge, Spinner } from "../components/ui";
import AuthRequiredModal from "../components/AuthRequiredModal";


export default class Store extends Component {

    state = {
        items:[],
        keyword:'',
        searchCategories:[],
        sortOption: 'default',
        user:'',
        processed:false,
        favourites:[],
        error: null,
        loading: true,
        showAuthModal: false,
        authModalCallback: null,
        loginMessage: '',
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

    componentWillUnmount() {
        if (this.loginMessageTimer) clearTimeout(this.loginMessageTimer);
    }

    // Pipeline: allItems -> keywordFiltered -> categoryFiltered -> sortedItems
    getKeywordFiltered(items, keyword) {
        const itemsSafe = Array.isArray(items) ? items : [];
        if (!keyword || !keyword.trim()) return itemsSafe;
        const kw = keyword.toLowerCase().trim();
        return itemsSafe.filter(item => item && item.name && item.name.toLowerCase().includes(kw));
    }

    getCategoryFiltered(items, searchCategories) {
        const itemsSafe = Array.isArray(items) ? items : [];
        if (!Array.isArray(searchCategories) || searchCategories.length === 0) return itemsSafe;
        return itemsSafe.filter(item => item && item.category && searchCategories.includes(item.category));
    }

    getSortedItems(items, sortOption) {
        const itemsSafe = Array.isArray(items) ? items : [];
        if (!sortOption || sortOption === 'default') return [...itemsSafe];
        const sorted = [...itemsSafe];
        if (sortOption === 'price-asc') {
            sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        } else if (sortOption === 'price-desc') {
            sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        } else if (sortOption === 'title-asc') {
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortOption === 'newest') {
            sorted.sort((a, b) => {
                const idA = (a._id && a._id.toString) ? a._id.toString() : '';
                const idB = (b._id && b._id.toString) ? b._id.toString() : '';
                return idB.localeCompare(idA);
            });
        }
        return sorted;
    }

    getFilteredAndSortedItems() {
        const itemsSafe = Array.isArray(this.state.items) ? this.state.items : [];
        const keyword = this.state.keyword || '';
        const searchCategories = Array.isArray(this.state.searchCategories) ? this.state.searchCategories : [];
        const sortOption = this.state.sortOption || 'default';

        const keywordFiltered = this.getKeywordFiltered(itemsSafe, keyword);
        const categoryFiltered = this.getCategoryFiltered(keywordFiltered, searchCategories);
        const hasFilters = !!keyword.trim() || searchCategories.length > 0;
        const filtered = hasFilters ? categoryFiltered : keywordFiltered;
        return this.getSortedItems(filtered, sortOption);
    }

    getCategoryCounts(items) {
        const itemsSafe = Array.isArray(items) ? items : [];
        const categories = ['Dorm & Home', 'Electronics', 'Books', 'Apparel', 'Tickets & Events', 'Other'];
        const counts = {};
        categories.forEach(cat => { counts[cat] = 0; });
        itemsSafe.forEach(item => {
            if (item && item.category && counts.hasOwnProperty(item.category)) {
                counts[item.category]++;
            }
        });
        return counts;
    }

    clearFilters = () => {
        this.setState({ keyword: '', searchCategories: [], sortOption: 'default' });
    }

    showLoginMessage = () => {
        this.setState({ loginMessage: 'Log in to save items' });
        if (this.loginMessageTimer) clearTimeout(this.loginMessageTimer);
        this.loginMessageTimer = setTimeout(() => this.setState({ loginMessage: '' }), 3000);
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
        const categories  = ['Dorm & Home', 'Electronics', 'Books', 'Apparel', 'Tickets & Events', 'Other'];
        
        const itemsSafe = Array.isArray(this.state.items) ? this.state.items : [];
        const keyword = this.state.keyword || '';
        const searchCategories = Array.isArray(this.state.searchCategories) ? this.state.searchCategories : [];
        const sortOption = this.state.sortOption || 'default';

        const keywordFiltered = this.getKeywordFiltered(itemsSafe, keyword);
        const categoryFiltered = this.getCategoryFiltered(keywordFiltered, searchCategories);
        const hasKeywordOrCategory = !!keyword.trim() || searchCategories.length > 0;
        const filteredItems = hasKeywordOrCategory ? categoryFiltered : keywordFiltered;
        const sortedItems = this.getSortedItems(filteredItems, sortOption);

        const categoryCounts = this.getCategoryCounts(filteredItems);
        const hasActiveFilters = !!keyword.trim() || searchCategories.length > 0 || sortOption !== 'default';
        const resultCount = sortedItems.length;

        return(
            <div className="min-h-screen bg-[var(--color-bg)]">
                <AuthRequiredModal
                    isOpen={this.state.showAuthModal}
                    onClose={this.handleAuthModalClose}
                    onSuccess={this.handleAuthModalSuccess}
                />
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PageHeader 
                        title="Store"
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
                                        {keyword.trim() && (
                                            <Badge variant="primary" className="inline-flex items-center">
                                                Search: {keyword}
                                                <button
                                                    onClick={() => this.setState({keyword: ''})}
                                                    className="ml-2 hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    aria-label="Remove keyword filter"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        {searchCategories.map(cat => (
                                            <Badge key={cat} variant="primary" className="inline-flex items-center">
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
                                        {sortOption !== 'default' && (
                                            <Badge variant="primary" className="inline-flex items-center">
                                                Sort
                                                <button
                                                    onClick={() => this.setState({ sortOption: 'default' })}
                                                    className="ml-2 hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    aria-label="Reset sort"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        <button
                                            onClick={this.clearFilters}
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
                                        const isSelected = searchCategories.includes(catg);
                                        const count = categoryCounts[catg] ?? 0;
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
                                                    {catg} ({count})
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
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-medium text-[var(--color-text)]">
                                                Categories
                                            </label>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={this.clearFilters}
                                                    className="text-xs text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {categories.map(catg => {
                                                const isSelected = searchCategories.includes(catg);
                                                const count = categoryCounts[catg] ?? 0;
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
                                                            {catg} ({count})
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </aside>

                        {/* Right Column - Results */}
                        <main className="lg:col-span-3">
                            {this.state.loading && (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Spinner className="h-8 w-8 mb-4" alt="" />
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

                            {this.state.loginMessage && (
                                <div className="mb-4 px-4 py-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg text-sm">
                                    {this.state.loginMessage}
                                </div>
                            )}
                            
                            {!this.state.loading && !this.state.error && resultCount === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 px-4">
                                    <p className="text-base text-[var(--color-muted)] mb-4">No items match your filters.</p>
                                    <button
                                        onClick={this.clearFilters}
                                        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                            
                            {!this.state.loading && !this.state.error && resultCount > 0 && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                        {hasActiveFilters && (
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {keyword.trim() && (
                                                    <Badge variant="primary" className="inline-flex items-center gap-1">
                                                        Search: {keyword}
                                                        <button
                                                            onClick={() => this.setState({ keyword: '' })}
                                                            className="ml-1 hover:opacity-70 min-w-[28px] min-h-[28px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]"
                                                            aria-label="Remove search filter"
                                                        >
                                                            ×
                                                        </button>
                                                    </Badge>
                                                )}
                                                {searchCategories.map(cat => (
                                                    <Badge key={cat} variant="primary" className="inline-flex items-center gap-1">
                                                        {cat}
                                                        <button
                                                            onClick={() => this.addSearchCategory(cat)}
                                                            className="ml-1 hover:opacity-70 min-w-[28px] min-h-[28px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]"
                                                            aria-label={`Remove ${cat} filter`}
                                                        >
                                                            ×
                                                        </button>
                                                    </Badge>
                                                ))}
                                                {sortOption !== 'default' && (
                                                    <Badge variant="primary" className="inline-flex items-center gap-1">
                                                        Sort: {sortOption === 'newest' ? 'Newest' : sortOption === 'price-asc' ? 'Price ↑' : sortOption === 'price-desc' ? 'Price ↓' : sortOption === 'title-asc' ? 'Title A→Z' : sortOption}
                                                        <button
                                                            onClick={() => this.setState({ sortOption: 'default' })}
                                                            className="ml-1 hover:opacity-70 min-w-[28px] min-h-[28px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]"
                                                            aria-label="Reset sort"
                                                        >
                                                            ×
                                                        </button>
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-end">
                                            <label className="text-sm text-[var(--color-muted)] mr-2">Sort:</label>
                                            <select
                                                value={sortOption}
                                                onChange={(e) => this.setState({ sortOption: e.target.value })}
                                                className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                            >
                                                <option value="default">Default</option>
                                                <option value="newest">Newest</option>
                                                <option value="price-asc">Price: low → high</option>
                                                <option value="price-desc">Price: high → low</option>
                                                <option value="title-asc">Title: A → Z</option>
                                            </select>
                                        </div>
                                    </div>
                                    <StoreItems
                                        refresh={this.refresh}
                                        favourites={Array.isArray(this.state.favourites) ? this.state.favourites : []}
                                        user={this.state.user}
                                        data={sortedItems}
                                        onAuthRequired={this.handleAuthRequired}
                                        onLoginPrompt={this.showLoginMessage}
                                    />
                                </>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        )
    }

    
}

