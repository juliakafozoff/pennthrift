import React from 'react';
import { Component, useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import axios from "axios";
import ProfileListings from "../components/ProfileListings";
import { Alert, StyleSheet, Text, View, Image, Pressable, Button, ScrollView, TouchableHighlight, TextInput } from 'react-native';
import { Linking } from 'react-native';
import RadioForm from 'react-native-simple-radio-button';


const NewItem = ({ navigation, route }) => {

    const [itemName, setItemName]           = useState(''); ///
    const [description, setDescription]     = useState(''); ///
    const [conditiion, setCondition]        = useState('');
    const [category, setCategory]           = useState('');
    const [price, setPrice]                 = useState(0);  ///
    const [image, setImage]                 = useState( );
    const [imageDisplay, setImageDisplay]   = useState('');
    const [userID, setUserID]               = useState('');
    const [user, setUser]                   = useState('');
    const [error, setError]                 = useState('');
    const [clickable, setClickable]         = useState(true)
    const conditiions = ['New', 'Like new', 'Lightly used', 'Used'];
    const categories  = ['Dorm & Home', 'Electronics', 'Books', 'Apparel', 'Tickets & Events', 'Other']
    //const navigate = useNavigate();
    //const inputRef = useRef()

    /*
    useEffect(() =>{
        if(!user && !userID){
            axios.get('/api/auth/user').then( res => {
                setUser(res.data);
                axios.get('/api/profile/' + res.data).then( res => {
                    setUserID(res.data._id)
                })
            })
        }
    });

    function submit(){
        if(itemName && description && category && price && user && userID && image){
            setClickable(false)
            var formData = new FormData();
            formData.append("file", image);
            axios.post('/api/file/upload', formData,{
                headers: {
                'Content-Type': 'multipart/form-data'
                }
            }).then( res => {
                let imageUrl = res.data; 
                const data = {
                    name:itemName,
                    description:description,
                    category:category,
                    username:user,
                    price:price,
                    owner:user,
                    to_sell:false,
                    to_trade:false,
                    image:imageUrl,
                }
    
                axios.post('/api/profile/item/new', data).then(res => {
                    if(res.data == 'Item added succesfully'){
                        navigate('/profile', { replace:true })
                    }
                })
            })
        }else{
            setError('Please fill out all items')
        }
    };

    function handleClick(){
        document.getElementById('selectImage').click()
    }
    
    function processImage(image){
        setImage(image);
        setImageDisplay(URL.createObjectURL(image));
    }
    */
    

    const [chosenOption, setChosenOption] = useState('');

    const condition_options = [
        { label: 'New', value: 'new' },
        { label: 'Like new', value: 'like new' },
        { label: 'Lightly used', value: 'lightly used' },
        { label: 'Used', value: 'used' }
    ];

    const category_options = [
        { label: 'Dorm & Home', value: 'Dorm & Home' },
        { label: 'Electronics', value: 'Electronics' },
        { label: 'Books', value: 'Books' },
        { label: 'Apparel', value: 'Apparel' },
        { label: 'Tickets & Events', value: 'Tickets & Events' },
        { label: 'Other', value: 'Other' },
    ];

    const handlePress = () => {
        navigation.navigate('Profile', { username: "girlboss" })
        // Add the new item to the user's collection of listings
    }

    const Separator = () => (
        <View style={styles.separator} />
    );

    // add header
    return(
        <ScrollView style={styles.container}>
            <Header navigation={navigation}/>
            <View>
                <View>
                    <View>
                        <View>
                        <View style={{marginTop: 15}}></View>

                            <Text style={styles.subheading}>
                                Item Name:
                            </Text>
                            <View style={{backgroundColor:"#fff", paddingTop:5, paddingBottom:5, borderWidth:1, borderColor:"#0053bf"}}>
                                <TextInput
                                    style={styles.text_box}
                                    placeholder='Item name'
                                    value={itemName}
                                    onChange={(event) => setItemName(event.target.value)}/>
                            </View>
                        </View>
                        <Image source={imageDisplay}/>

                        <Separator />

                        <View>
                            <Text style={styles.subheading}>Upload an image</Text>
                        </View>

                        <View style={{justifyContent: "center",}}>
                            <Text>[Upload image goes here]</Text>
                        </View>
                        
                        <Separator />
                    </View>


                    <View>
                        <View>
                            <Text style={styles.subheading}>
                                Item Description:
                            </Text>
                            <View style={{backgroundColor:"#fff", paddingTop:5, paddingBottom:5, borderWidth:1, borderColor:"#0053bf"}}>
                                <TextInput
                                    style={styles.text_box}
                                    placeholder='Item description'
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}/>
                            </View>
                        </View>

                        <View style={{marginTop: 15}}></View>

                        <View>
                            <Text style={styles.subheading}>
                                Price:
                            </Text>
                            <View style={{backgroundColor:"#fff", paddingTop:5, paddingBottom:5,borderWidth:1, borderColor:"#0053bf"}}>
                                <TextInput
                                    style={styles.text_box}
                                    placeholder='Item price'
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}/>
                            </View>
                        </View>

                        <View>
                            <Text style={styles.subheading}>
                                Condition:
                            </Text>
                            <View style={styles.radio_buttons_view}>
                                <RadioForm
                                    radio_props={condition_options}
                                    initial={0}
                                    onPress={(value) => {
                                        setCategory(value);
                                    }}
                                />
                            </View>
                        </View>

                        <View style={{marginBottom: 10}}></View>

                        <View>
                            <Text style={styles.subheading}>
                                Category:
                            </Text>
                            <View style={styles.radio_buttons_view}>
                                <RadioForm
                                    radio_props={category_options}
                                    initial={0}
                                    onPress={(value) => {
                                        setCondition(value);
                                    }}
                                />
                            </View>
                        </View>


                        <View >
                            <Button
                                title= {"Submit"}
                                onPress={() => Alert.alert(
                                'You just posted an item to the marketplace',
                                'Check out your new listing.',
                                [
                                    {text: 'OK', onPress: handlePress()}
                                ],
                                { cancelable: false }
                                )}
                            />
                        </View>

                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      margin: 15,
    },
    title_text: {
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
    },
    subheading: {
        marginBottom: 10,
        marginTop: 10,
        marginLeft: 15,
        fontSize: 20,
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: "bold",
    },
    radio_buttons_view: {
        marginLeft: 30,
    },
    radio_buttons_text: {
        marginLeft: 20,
    },
    separator: {
        marginVertical: 8,
        borderBottomColor: '#737373',
        borderBottomWidth: 1,
        marginTop: 20,
        marginBottom: 20,
    },
    button: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 10,
        margin: 30,
      },
      submit_button: {
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
      submit_view: {
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
      test: {
        backgroundColor: "#3672d1",
      }
  });

export default NewItem;