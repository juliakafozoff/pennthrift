import api from "../api/http";
import { Component, useEffect, useState } from "react";
import { Link, renderMatches } from "react-router-dom";
import Header from "../components/Header";
import ProfileListings from "../components/ProfileListings";
import { getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_user.png';
import { PageHeader, Card, Badge, Button } from "../components/ui";


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
                                    alt={this.state.user || 'Profile'}
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
                                title={this.state.user || 'Profile'}
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