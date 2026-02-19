import StoreItems from "../components/StoreItems";
import Header from "../components/Header";
import { Component } from "react";
import api from "../api/http";
import { getUserFavourites, getUserProfile } from "../api/ProfileAPI";


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
        
        return(
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
                            {this.state.user ? `${this.state.user}'s Saved Items` : 'My Saved Items'}
                        </h1>
                        <p className="text-[var(--color-muted)]">
                            {favouritesSafe.length === 0 
                                ? 'No saved items yet' 
                                : `${favouritesSafe.length} ${favouritesSafe.length === 1 ? 'item' : 'items'} saved`}
                        </p>
                    </div>

                    {/* Search and Filters */}
                    {favouritesSafe.length > 0 && (
                        <div className="mb-8 p-6 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Keyword Search */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[var(--color-text)]">
                                        Search by keyword
                                    </label>
                                    <input 
                                        onChange={(e) => this.setState({keyword:e.target.value})} 
                                        placeholder="Search items..." 
                                        value={this.state.keyword}
                                        className="border border-[var(--color-border)] py-2 px-4 rounded-md text-sm bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" 
                                    />
                                </div>

                                {/* Category Filters */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[var(--color-text)]">
                                        Filter by category
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {categories.map( catg => {
                                            const isSelected = this.state.searchCategories.includes(catg);
                                            return(
                                                <label 
                                                    key={catg}
                                                    className={`flex gap-2 items-center cursor-pointer p-2 rounded hover:bg-[var(--color-surface-2)] transition-colors ${
                                                        isSelected ? 'bg-[var(--color-primary)]/10' : ''
                                                    }`}
                                                >
                                                    <input 
                                                        type='checkbox' 
                                                        checked={isSelected}
                                                        onChange={() => this.addSearchCategory(catg)}
                                                        className="accent-[var(--color-primary)]"
                                                    />
                                                    <span className="text-[var(--color-text)]">{catg}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-[var(--color-text)]">
                                        Results
                                    </label>
                                    <div className="text-lg font-semibold text-[var(--color-primary)] pt-2">
                                        {searchedItems.length} {searchedItems.length === 1 ? 'item' : 'items'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                        <div className="">
                            <StoreItems
                                refresh={this.refresh}
                                favourites={this.state.favourites2}
                                user={this.state.user}
                                data={searchedItems}
                            />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    
}

