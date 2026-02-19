import { Component } from 'react'
import { Link } from 'react-router-dom';
import React from 'react';
import { Card, Badge } from './ui';
import { normalizeImageUrl } from '../utils/imageUtils';

export default class StoreItems extends Component{

    state = {
        items:[],
        favourites:[],
        updatedItems:[]

    }


    constructor(props){
        super(props);
        const dataSafe = Array.isArray(props.data) ? props.data : [];
        this.state = {
            items: dataSafe,
            favourites: Array.isArray(props.favourites) ? props.favourites : [],
            updatedItems: []
        };
    }
    componentDidMount(){
        const dataSafe = Array.isArray(this.props.data) ? this.props.data : [];
        if(JSON.stringify(this.state.items) !== JSON.stringify(dataSafe)){
            this.setState({items: dataSafe});
        }
        if(Array.isArray(this.props.favourites)){
            this.setState({favourites: this.props.favourites});
        }
    }
    componentDidUpdate(prevProps){
        const dataSafe = Array.isArray(this.props.data) ? this.props.data : [];
        if(JSON.stringify(prevProps.data) !== JSON.stringify(this.props.data)){
            this.setState({items: dataSafe});
        }
        if(Array.isArray(this.props.favourites) && JSON.stringify(prevProps.favourites) !== JSON.stringify(this.props.favourites)){
            this.setState({favourites: this.props.favourites});
        }
    }
    
    
    render(){
        

        const favourite = (id) =>{
            const favouritesSafe = Array.isArray(this.state.favourites) ? this.state.favourites : [];
            if(id && favouritesSafe.includes(id)){
                return require('../assets/favourite_red.png')
            }
            return require('../assets/favourite.png')
        }

        const update = (id) =>{
            if (!id) return;
            const favouritesSafe = Array.isArray(this.state.favourites) ? this.state.favourites : [];
            if(favouritesSafe.includes(id)){
               const updated = favouritesSafe.filter((item) => item !== id);
               return this.setState({favourites: updated});
            }
           return this.setState({favourites: [...favouritesSafe, id]});
        }

        

        

        const itemsSafe = Array.isArray(this.state.items) ? this.state.items : [];
        const favouritesSafe = Array.isArray(this.state.favourites) ? this.state.favourites : [];

        if(itemsSafe.length === 0){
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <svg 
                        className="w-24 h-24 text-[var(--color-muted)] mb-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">No items found</h3>
                    <p className="text-base text-[var(--color-muted)] text-center max-w-md">
                        Try adjusting your search or filters to find what you're looking for.
                    </p>
                </div>
            );
        }

        return(
            <div data-testid="storeitems" className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {
                    itemsSafe.map(item => {
                        if(!item || !item._id) return null;
                        
                        const isFavourite = favouritesSafe.includes(item._id);
                        
                        return(
                            <Card 
                                data-testid="itemid" 
                                key={item._id}
                                className="group hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                padding="none"
                            >
                                <Link to={`/store/item/${item._id}`} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-2)]">
                                        <img 
                                            src={item.image ? normalizeImageUrl(item.image) : require('../assets/placeholder_item.png')} 
                                            alt={item.name || 'Item'}
                                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                                            onError={(e) => {
                                                e.target.src = require('../assets/placeholder_item.png');
                                            }}
                                        />
                                    </div>
                                </Link>
                                <div className='p-4 space-y-3'>
                                    <div className="flex items-start justify-between gap-2">
                                        {item.category && (
                                            <Badge variant="default" className="text-xs">
                                                {item.category}
                                            </Badge>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                update(item._id);
                                            }}
                                            className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] min-w-[44px] min-h-[44px] flex items-center justify-center"
                                            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                                        >
                                            <img 
                                                src={favourite(item._id)}  
                                                className='w-5 h-5'
                                                alt={isFavourite ? 'Favourite' : 'Not favourite'}
                                            />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text)] mb-1 min-h-[2.5rem] overflow-hidden" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {item.name || 'Untitled'}
                                        </h3>
                                        <p className="text-lg font-semibold text-[var(--color-primary)]">
                                            ${item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                    {item.owner && (
                                        <Link 
                                            to={`/user/${item.owner}`} 
                                            className='text-sm text-[var(--color-primary)] hover:underline block truncate'
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            @{item.owner}
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        )
                    })
                }
            </div>
        )
    }
}