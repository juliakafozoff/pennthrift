import axios from 'axios';
import { Component } from 'react'
import { Link } from 'react-router-dom';
import React from 'react';

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
                <div className="text-center py-10">No items found</div>
            );
        }

        return(
            <div data-testid="storeitems" className='grid justify-center mt-20 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-2'>
                {
                    itemsSafe.map(item => {
                        if(!item || !item._id) return null;
                        
                        return(
                            <div data-testid="itemid" key={item._id}  className="border-2 w-56 p-5 border-[#368481] w-fit">
                                <Link to={`/store/item/${item._id}`}>
                                    <img 
                                        src={item.image || require('../assets/placeholder_item.png')} 
                                        alt={item.name || 'Item'}
                                        className='w-full border-[#368481] rounded-lg border-2 h-36'
                                        onError={(e) => {
                                            e.target.src = require('../assets/placeholder_item.png');
                                        }}
                                    />
                                </Link>
                                <div className='flex mt-5 text-xs gap-5'>
                                    <div className='font-bold'> 
                                        {item.category || 'Uncategorized'}
                                    </div>
                                    <div className='flex gap-2 w-full flex-col'>
                                        <div>{item.name || 'Untitled'}</div>
                                        <div> ${item.price ? parseFloat(item.price).toFixed(2) : '0.00'}</div>
                                       <div className='flex items-center  justify-between'> 
                                           {item.owner && (
                                               <Link to={`/user/${item.owner}`} className='text-blue-600 w-18 truncate overflow-ellipsis underline'>@{item.owner}</Link>
                                           )}
                                           <img 
                                            onClick={() => update(item._id)}
                                            src={favourite(item._id)}  
                                            className='w-5 cursor-pointer h-5'
                                            alt="favourite"
                                           />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    }
}