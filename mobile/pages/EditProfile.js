import Header from "../components/Header"
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import React from 'react';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { editUserProfile, getUserProfile } from "../ProfileAPI.js";
import placeholder from '../assets/placeholder_user.png';
import { Alert, StyleSheet, Text, TextInput, View, Image, Pressable, Button, ScrollView, TouchableHighlight } from 'react-native';

//import { useNavigate } from "react-router-dom";

// TODO: pass user info through props instead of axios
const EditProfile = ({navigation, route}) => {
    const { replace, username } = route.params;

    const [bio, setBio]                     = useState('Edit description');
    const [user, setUser]                   = useState('');
    const [userInfo, setUserInfo]           = useState('');
    const [image, setImage]                 = useState( );
    const [imageDisplay, setImageDisplay]   = useState('');
    const [year, setYear]                   = useState();
    const [venmo, setVenmo]                 = useState();
    const [interests, setInterests]         = useState([]);
    const [processed, setProcessed]         = useState(false);
    const [loading, setLoading]                           = useState(false);
    const inputRef = useRef();
    // const navigate = useNavigate();

    const getUserInfo = async () => {
        // if (!userInfo) {
        //     const res = await axios.get(`http://localhost:4000/api/auth/${username}`);
        //     setUser(res.data);
        //     if(user)setUserInfo(await getUserProfile(user));
        // }
        // if(userInfo && !processed){
        //     processUserInfo(userInfo);
        //     setProcessed(true);
        // }
        getUserProfile(username)
        .then(info => setUserInfo(info))
        .catch(err => console.log(err));
        if (userInfo && !processed) {
            processUserInfo(userInfo);
            setProcessed(true);
        }
    }

    getUserInfo();
   
    useEffect(() =>{},[loading])

    function processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        setBio(bio);
        setYear(class_year);
        if(interests)setInterests(interests);
        setVenmo(venmo);
        setImageDisplay(profile_pic);
    }

    function handleClick(){
        document.getElementById('selectImage').click()
    }


    function processImage(image){
        setImage(image);
        setImageDisplay(URL.createObjectURL(image));
    }

    function processInterests(val){
        var intrs = [...interests];
        if(interests.includes(val)){
            intrs = intrs.filter( item => item !== val )
            setInterests([...intrs])
        }else{
            intrs.push(val)
            setInterests([...intrs])
        }
    }

    const uClassList = [
        {val:'2022'},
        {val:'2023'},
        {val:'2024'},
        {val:'2025'}
    ]

    const interestsList = [
        {val:'Dorm & Home'},
        {val:'Electronics'},
        {val:'Books'},
        {val:'Apparel'},
        {val:'Tickets & Events'},
        {val:'Other'}
    ]

    

    function save(){
        setLoading(true);
        if(image){
            var formData = new FormData();
            formData.append("file", image);

            axios.post('http://localhost:4000/api/file/upload', formData,{
                headers: {
                'Content-Type': 'multipart/form-data'
                }
            }).then( res => {
                const imageUrl = res.data;
                const data = {
                    bio:bio,
                    profile_pic:imageUrl,
                    username:user,
                    venmo:venmo,
                    class_year:year,
                    interests:interests,
                }

                editUserProfile(user, data).then(res =>{
                    if(res === 'Success! User updated.'){
                        navigate('/profile', {replace:true})
                    }
                })
            

            })
        return;
        }else if(imageDisplay && !image){
            const data = {
                bio:bio,
                profile_pic:'',
                username:user,
                venmo:venmo,
                class_year:year,
                interests:interests,
                profile_pic:imageDisplay
            }

            editUserProfile(user, data).then(res =>{
                if(res === 'Success! User updated.'){
                    navigate('/profile', {replace:true})
                }
            })
            return;
        }else{
            const data = {
                bio:bio,
                profile_pic:'',
                username:user,
                venmo:venmo,
                class_year:year,
                interests:interests,
            }

            editUserProfile(user, data).then(res =>{
                if(res === 'Success! User updated.'){
                    navigate('/profile', {replace:true})
                }
            })

        }
        setLoading(false);
        return;
    }

   
    return(
        <ScrollView>
            <Header navigation={navigation}/>
            <View style={styles.bio_box}>
                            <View style={{justifyContent:'center', alignItems: 'center', flexDirection: 'column'}}>
                                <Image style={styles.profile_pic} source={imageDisplay || placeholder}/>
                            </View>

                            <View style={styles.username_view}>
                                <Text style={styles.username}>{username}</Text>
                            </View>

                            <View style={styles.description_view}>
                                <Text style={styles.description_text}>
                                    {bio}
                                </Text>
                            </View>

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
                                <View>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <Image style={{marginLeft: 30, marginRight: 15, width:25, height:30}} source={require('../assets/vimeo.png')}/>
                                        <Text style={styles.venmo_text}>{venmo}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={{marginBottom: 10}}></View>
                        </View>
            <View>
                <View>
                    <View style={{marginBottom: 20}}></View>


                    <View>
                        <View style={{marginLeft: 15, marginBottom: 10}}>
                            <Text style={styles.search_heading}>
                                <Text style={{color:"#013587"}}> {username} </Text> 's profile
                            </Text>
                        </View>
                        <View style={styles.text_box_view}>
                            <TextInput placeholder="Search" style={styles.text_box}/>
                        </View>
                    </View>

                    <View style={{marginBottom: 15}}></View>

                    <View style={{marginBottom: 20}}>
                        <View style={{marginLeft: 15, marginBottom: 10}}>
                            <Text style={styles.search_heading}>
                                Search by<Text style={{color:"#013587"}}> category:</Text>
                            </Text>
                        </View>
                        <View style={{marginLeft: 20}}>
                            <BouncyCheckbox
                                size={25}
                                fillColor="red"
                                unfillColor="#FFFFFF"
                                text="Dorm & Home"
                                iconStyle={{ borderColor: "red" }}
                                textStyle={{ textDecorationLine: "none"}}
                            />
                            <BouncyCheckbox
                                size={25}
                                fillColor="red"
                                unfillColor="#FFFFFF"
                                text="Electronics"
                                iconStyle={{ borderColor: "red" }}
                                textStyle={{ textDecorationLine: "none"}}
                            />
                            <BouncyCheckbox
                                size={25}
                                fillColor="red"
                                unfillColor="#FFFFFF"
                                text="Books"
                                iconStyle={{ borderColor: "red" }}
                                textStyle={{ textDecorationLine: "none"}}
                            />
                            <BouncyCheckbox
                                size={25}
                                fillColor="red"
                                unfillColor="#FFFFFF"
                                text="Apparel"
                                iconStyle={{ borderColor: "red" }}
                                textStyle={{ textDecorationLine: "none"}}
                            />
                            <BouncyCheckbox
                                size={25}
                                fillColor="red"
                                unfillColor="#FFFFFF"
                                text="Tickets & Events"
                                iconStyle={{ borderColor: "red" }}
                                textStyle={{ textDecorationLine: "none"}}
                            />
                            <BouncyCheckbox
                                size={25}
                                fillColor="red"
                                unfillColor="#FFFFFF"
                                text="Other"
                                iconStyle={{ borderColor: "red" }}
                                textStyle={{ textDecorationLine: "none"}}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
        )
}

const styles = StyleSheet.create({
    title: {
        marginTop: 16,
        marginBottom: 25,
        paddingVertical: 10,
        textAlign: "center",
        fontSize: 30,
        fontWeight: "bold",
        justifyContent: 'center',
        alignItems: 'center',
      },
      search_heading: {
        fontSize: 20,
        fontWeight: "bold",
    },
    text_box: {
        margin: 5,
        width: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text_box_view: {
        backgroundColor:"#fff",
        borderWidth:1,
        borderColor:"#0053bf",
        marginLeft: 20,
        width:"50%",
    },
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
        width: 200,
        marginTop: 15,
        marginBottom: 15
    },
    username: {
        fontSize: 35,
        fontWeight: "bold",
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
    analytics_button: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        height: 40,
        width:160,
        borderRadius:10,
        backgroundColor : "#0067b0",
        justifyContent: "center",
        alignItems: "center",
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
      }
  });

export default EditProfile;


 //EDIT PROFILE PLACEHOLDER
 // return(
    //     <View>
    //         <Header/>
    //         <View>
    //             <View>
    //                 <View>
    //                     <Text>
    //                         <Text>{user}'s</Text>
    //                         <Text>profile</Text>
    //                     </Text>
    //                     {/*<Image
    //                         source={imageDisplay}/>*/}
    //                     <View onPress={() => handleClick()}>
    //                         <Text>Upload an image</Text>
    //                         {/*
    //                         <TextInput
    //                             id='selectImage' 
    //                             hidden type="file" 
    //                             ref={inputRef}
    //                             accept="image/png, image/gif, image/jpeg"
    //                             onChange={event => processImage(inputRef.current.files[0]) } />
    //                         */}
    //                     </View>

    //                     <TextInput 
    //                         //onChange={event => setBio(event.target.value)} 
    //                         value={bio} 
    //                         style={{resize:"none"}}
    //                         />
    //                 </View>

    //                 <View>
    //                     <View>
    //                         <Text>My name is: </Text>
    //                         <TextInput value={user}/>
    //                     </View>

    //                     <View>
    //                         <View>
    //                             <Text>I am class of: </Text>
    //                             <View>
    //                                 {
    //                                     /*
    //                                     uClassList.map( uc =>{
    //                                         return(
    //                                             <span key={uc.val} onClick={() => {setYear(uc.val)}}>
    //                                                 <input checked={uc.val === year} type='radio'/>
    //                                                 <span>{uc.val}</span>
    //                                             </span>
    //                                         )
    //                                     })
    //                                     */
    //                                 }
    //                             </View>
    //                         </View>
    //                     </View>
    //                     <View>
    //                         <View>
    //                            <Text>I’m most interested in: </Text>
    //                             <View>
    //                                 {
    //                                     /*
    //                                     interestsList.map( intr => {
    //                                         return(
    //                                             <span key={intr.val} onClick={() =>processInterests(intr.val)} className="">
    //                                                 <input checked={interests.includes(intr.val)} type='checkbox' className="h-4 w-4" />
    //                                                 <span className="ml-2">{intr.val}</span>
    //                                             </span>                                          
    //                                         )
    //                                     })
    //                                     */
    //                                 }
    //                             </View>
    //                         </View>
    //                     </View>
    //                     <View>
    //                         <Text>My venmo is: </Text>
    //                         {/*<TextInput value={venmo} onChange={(e) => setVenmo(e.target.value)}/>*/}
    //                     </View>
    //                     <View>
    //                         {
    //                             /*
    //                             !loading && 
    //                                 <Button
    //                                 onPress={() => save()}>Save</Button>
    //                             */
    //                         }
    //                         {
    //                             /*
    //                             loading &&
    //                             <Image
    //                             source={require('../assets/loading.gif')}/>
    //                             */
    //                         }
    //                     </View>
    //                 </View>
    //             </View>
    //         </View>
    //     </View>
    // )