import api from "../api/http";
import { Component, useEffect, useState } from "react";
import { Link, renderMatches } from "react-router-dom";
import Header from "../components/Header";
import ProfileListings from "../components/ProfileListings";
import { getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_user.png';


export default class Profile extends Component {
    

    state = {
        items:[],
        user:global.USER,
        bio:'',
        profile_pic:'',
        venmo:'',
        year:'',
        processed:false,
        userInfo:'',
        interests:[],
    }
    componentDidMount(){
        const user = this.state.user;
        const items = this.state.items;
        const processed = this.state.processed;
        const userInfo = this.state.userInfo;
        if(!user){
            api.get('/api/auth/user')
                 .then( res => {
                    this.setState({ user: res.data});
            });
        }
        if(items.length === 0 && user){
    
            api.get(`/api/profile/items/${user}`)
                    .then( res => {this.setState({items: res.data.items.reverse()})})
                    .catch(e => console.log(e))

        }
        
        if(user)getUserProfile(user).then(info => this.setState({userInfo:info}))
        if(user && userInfo && !processed){
            this.processUserInfo(userInfo);
            this.setState({processed:true})
        }

    }

    processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        this.setState({bio:bio, year:class_year, venmo:venmo, profile_pic:profile_pic});
        if(interests)this.setState({interests:interests});

    }



    componentDidUpdate(){
        const user = this.state.user;
        const items = this.state.items;
        const processed = this.state.processed;
        const userInfo = this.state.userInfo;
        if(!user){
            api.get('/api/auth/user')
                 .then( res => {
                    this.setState({ user: res.data});
            });
            
        }
        if(items.length === 0 && user){
    
            api.get(`/api/profile/items/${user}`)
                    .then( res => {this.setState({items: res.data.items.reverse()})})
                    .catch(e => console.log(e))

        }
        if(user)getUserProfile(user).then(info => this.setState({userInfo:info}))
        if(user && userInfo && !processed){
            this.processUserInfo(userInfo);
            this.setState({processed:true})
        }

    }

    refresh = () =>{
        const user = this.state.user;
        if(user){
            api.get(`/api/profile/items/${user}`)
                    .then( res => {this.setState({items: res.data.items.reverse()})})
                    .catch(e => console.log(e))

        }

    }

    render(){
        
        return(
            <div>
                <Header/>
                <div className="grid grid-main justify-center w-full h-full px-5 md:px-10">
                    <div className="col-span-8 mt-20 lg:gap-20 grid grid-cols-6">
                        <div className="lg:col-span-2 col-span-6 flex flex-col  items-center">
                            <img
                                className="w-60 rounded-full h-60" 
                                src={this.state.profile_pic || placeholder}/>
                            <div className="my-2 mt-5 self-start">Graduating Class : {this.state.year}</div>
                            <div className="my-2 lg:max-w-[250px] self-start">Interests: 
                                {
                                    this.state.interests.map((intr, index) => {
                                        return(
                                            <span> {intr} {index < this.state.interests.length - 1 ? ", " : ""}</span>
                                        )
                                    })
                                }
                            </div>
                            <div className="border my-5 w-full p-10 border-gray-200">
                                    {this.state.bio}
                            </div>
                        </div>
                        <div className="lg:col-span-4 col-span-6  h-fit grid gap-5">
                            <div className="flex justify-between">
                                <div>
                                    
                                    <div className="text-4xl mb-10 h-fit font-semibold">{this.state.user}</div>
                                    <div className="flex ">

                                        <img className="w-8 h-5" src={require('../assets/vimeo.png')}/>
                                        <div className="font-bold">{this.state.venmo}</div>
                                    </div>
                                </div>
                                
                                <div className="h-ffull flex">
                                    <Link to='/profile/analytics' className="p-1 border border-gray-400 h-fit font-semibold m-2 bg-gray-200">
                                        View Analytics
                                    </Link>
                                    <Link to='/profile/edit' className="p-1 border border-gray-400 h-fit  m-2 font-semibold bg-gray-200">
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>
                            <div>
                                Your listings:
                            </div>
                            <div className="">
                                <ProfileListings
                                    refresh={this.refresh}
                                    data={this.state.items}/>
                            </div>
                        </div>
                        
                    </div>
                </div>

            </div>
        )
    }
    

    

}