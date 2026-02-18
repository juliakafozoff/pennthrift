import StoreItems from "../components/StoreItems";
import Header from "../components/Header";
import { Component } from "react";
import axios from "axios";
import { getUserFavourites } from "../api/ProfileAPI";


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
    }
    
    componentDidMount(){
        this.loadItems();
        this.setUp();
    }

    loadItems = () => {
        if(this.state.items.length === 0){
            axios.get('/api/item/all')
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
                const res = await axios.get('/api/auth/user').catch(e => {
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


    render(){
        
    const categories  = ['For Fun', 'Vehicle', 'Apparel', 'Tickets', 
                            'Furniture', 'Electronics', 'Books/ notes', 'Miscellaneous']

        return(
            <div>
                <Header/>
                <div className="grid grid-main justify-center w-full h-full px-5 md:px-10">
                    <div className="grid my-10 mt-20 gap-10 grid-cols-4 ">
                        <div className="lg:col-span-1 col-span-4 flex gap-2 flex-col">
                            <div className="text-base">
                                Search by <span className="font-semibold"> keyword</span>
                            </div>
                            <div className="">
                                <input onChange={(e) => this.setState({keyword:e.target.value})} placeholder="Search" className="border py-1 border-black text-sm px-5" />
                            </div>
                        </div>
                        <div className="lg:col-span-2 col-span-4 flex gap-2 flex-col">
                            <div className="text-base">
                                Search by <span className="font-semibold"> category</span>
                            </div>
                            <div className="grid grid-cols-3 gap-y-2 text-xs accent-black grid-rows-2">
                                {
                                    categories.map( catg => {
                                        return(
                                            
                                            <span  className="flex gap-2 items-center"><input  onClick={() => this.addSearchCategory(catg)} type='checkbox'/> <span>{catg}</span></span>
                                        )
                                    } )
                                }
                            </div>
                        </div>
                        <div className="lg:col-span-1 col-span-4 flex gap-2 flex-col">
                            <div className="text-base">
                                Select <span className="font-semibold"> view</span>
                            </div>
                            <div className="text-xs grid gap-2 accent-black">
                                <span className="flex gap-2 items-center"><input type='checkbox'/> <span>List</span></span>
                                <span className="flex gap-2 items-center"><input type='checkbox'/> <span>Map</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        {this.state.loading && (
                            <div className="text-center py-10">Loading...</div>
                        )}
                        {this.state.error && (
                            <div className="text-center py-10 text-red-600">{this.state.error}</div>
                        )}
                        {!this.state.loading && !this.state.error && this.state.processed && (() => {
                            const itemsSafe = Array.isArray(this.state.items) ? this.state.items : [];
                            const searchResults = this.search(itemsSafe);
                            const searchResultsSafe = Array.isArray(searchResults) ? searchResults : [];
                            return (
                                <StoreItems
                                    refresh={this.refresh}
                                    favourites={Array.isArray(this.state.favourites) ? this.state.favourites : []}
                                    user={this.state.user}
                                    data={searchResultsSafe}/>
                            );
                        })()}
                    </div>
                </div>
                
            </div>
        )
    }

    
}

