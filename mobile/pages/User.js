import React from 'react';
import axios from "axios";
import { Component, useEffect, useState } from "react";
import Header from "../components/Header";
import StoreItems from "../components/StoreItems";
import ProfileListings from "../components/ProfileListings";
import { Alert, StyleSheet, Text, View, Image, Pressable, Button, ScrollView, TouchableHighlight } from 'react-native';
import { Linking } from 'react-native';


const User = (props) => {

    const item1 = {
        id:1,
        image:'https://www.quirkbooks.com/sites/default/files/styles/blog_detail_featured_image/public/editor_uploads/original/baby-bunny.jpg?itok=aS4SUzrj',
        category: "bunny",
        name:"Beige Goosh",
        owner:props.user,
        price:"12,000"
    };
    const item2 = {
        id:2, image:'https://scontent-iad3-1.xx.fbcdn.net/v/t1.6435-9/120563330_3251679801596421_5774388050002439408_n.jpg?stp=cp0_dst-jpg_e15_fr_q65&_nc_cat=103&ccb=1-6&_nc_sid=dd9801&efg=eyJpIjoidCJ9&_nc_ohc=Xa5gJQfuKkkAX9LvZS3&_nc_ht=scontent-iad3-1.xx&oh=00_AT9PzXjneY7V8ieyvVvQJBn6SXp5jA-PXhGrFK7MNzgZQQ&oe=62987064',
        category:"bunny",
        name:"Black Goosh",
        owner:props.user,
        price:"40,000"
    };

    const items = [item1, item2];

    const [bio, setBio]                     = useState("Young aspiring entrepreneur from California");
    const [userInfo, setUserInfo]           = useState('');
    //const [imageDisplay, setImageDisplay]   = useState('');
    const [year, setYear]                   = useState('2025');
    const [venmo, setVenmo]                 = useState('@california_kid');
    const [interests, setInterests]         = useState(["California"]);
    const [processed, setProcessed]         = useState(false);
    //const [items, setItems]                 = useState([item1, item2, item3]);
    const [viewer, setViewer]               = useState();
    const [viewed, setViewed]               = useState(false);
    // const { username } = useParams();

    const username = "california_kid"

    /*
    const getUserInfo = async () => {
        if (!userInfo) {
            const res = await axios.get('/api/auth/user');
            setViewer(res.data);
            if(username)setUserInfo(await getUserProfile(username));
        }
        if(userInfo && !processed){
            processUserInfo(userInfo);
            setProcessed(true);
        }
        if(viewer && !viewed){
            setViewed(true)
            updateViews(username);
        }
    }

    getUserInfo();

    function processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        setBio(bio);
        setYear(class_year);
        if(interests)setInterests(interests);
        setVenmo(venmo);
        setImageDisplay(profile_pic);
    }

    useEffect(() => {
        if(items.length === 0 && username){
            axios.get(`/api/profile/items/${username}`)
                    .then( res => {setItems(res.data.items.reverse())})
                    .catch(e => console.log(e))
        }
    },[items, bio, interests, imageDisplay, venmo, year])
    */




    return(
    <ScrollView>
        <Header/>
            <View>
                <View style={styles.bio_box}>
                    <View>
                        <View style={{justifyContent:'center', alignItems: 'center', flexDirection: 'column'}}>
                            <Image
                                source={require('../assets/california_kid.jpg')}
                                style={{height:180, width:180, margin:15}}/>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={styles.username_view}>
                                <Text style={styles.username}>{username}</Text>
                            </View>
                        </View>

                        <View style={{marginBottom: 10}}></View>

                        <Text style={styles.bio_text}>{bio}</Text>

                        <View style={{marginBottom: 15}}></View>
                    </View>
                    <View>
                        <View>


                        <View style={{marginBottom: 10}}></View>
                            
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                        
                                <Image style={{marginLeft: 30, marginRight: 15, width:25, height:30}} source={require('../assets/penn_logo.png')}/>

                                <Text style={styles.title_text}>Class of </Text>
                                <Text style={styles.title_text}>{year}</Text>
                            </View>

                            <View style={{marginBottom: 20}}></View>

                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Image style={{marginLeft: 25, marginRight: 15, width:30, height:30}} source={require('../assets/heart_icon.png')}/>
                                <Text style={styles.title_text}>Interests: </Text>
                                    <Text>{interests.map((interest) => interest+ ", ")}</Text>
                            </View>

                            <View style={{marginBottom: 20}}></View>

                            <View>
                                <View style={{flexDirection:'row', alignItems:'center'}}>
                                    <Image style={{marginLeft: 15, }}source={require('../assets/vimeo.png')}/>
                                    <Text style={styles.venmo_text}>{venmo}</Text>
                                </View>
                            </View>

                            <View style={{marginBottom: 10}}></View>
                            
                            <View>
                                <View style={{marginBottom: 20}}></View>
                                {/*<Link to='/profile/messages'>
                                    Message
                                </Link>*/}
                            </View>
                        </View>
                        <View>
                            <StoreItems
                                //items={items}
                                username={username}/>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    bio_box: {
        borderWidth:3,
        padding:10,
        margin: 10,
        // backgroundColor:"#ababab"
    },
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title_text: {
        fontSize: 20,
        fontWeight: "bold",
    },
    venmo_text: {
        fontSize: 20,
        color: "#0645AD", // link color
    },
    title_view: {
        paddingLeft: 25,
    },
    bio_text: {
        fontSize: 22,
        fontWeight: "bold",
        fontStyle:"italic",
        textAlign: 'center',
    },
    description_text: {
        color: "black",
        textShadowRadius: 1,
        fontSize: 20,
        fontStyle: 'italic'
    },
    description_view: {
        color: "black",
        textDecorationColor: "yellow",
        textShadowColor: "red",
        textShadowRadius: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:15,
        marginBottom:20
    },
    profile_pic: {
        resizeMode: 'contain',
        height: 200,
        marginTop: 15,
        marginBottom: 15
    },
    username: {
        fontSize: 32,
        fontWeight: "bold",
        marginBottom:15
    },
    username_view: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 10,
        marginBottom: 20,
      },
    new_item_button: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        height: 40,
        width:160,
        borderRadius:10,
        backgroundColor : "#3f9669",
        justifyContent: "center",
        alignItems: "center",
      },
  });

export default User;