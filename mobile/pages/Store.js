import React from 'react';
import axios from "axios";
import Header from "../components/Header";
import { Alert, StyleSheet, Text, TextInput, View, Image, Pressable, Button, ScrollView, TouchableHighlight } from 'react-native';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import StoreItems from "../components/StoreItems";
import { Component } from "react";
import { useState, useEffect } from 'react';

const Store = ({ navigation, route }) => {

    const [state, setState] = useState({items:[]});

    useEffect(() => {
        if (state.items.length === 0) {
            axios.get('http://localhost:4000/api/item/all/')
            .then(res => setState({items: res.data}))
            .catch(e => console.log(e));
        }
    }, [state])

    const item1 = {
        id:1,
        image:'https://www.quirkbooks.com/sites/default/files/styles/blog_detail_featured_image/public/editor_uploads/original/baby-bunny.jpg?itok=aS4SUzrj',
        category: "bunny",
        name:"Beige Goosh",
        owner:"Jubina",
        price:"12,000"
    };
    const item2 = {
        id:2, image:'https://scontent-iad3-1.xx.fbcdn.net/v/t1.6435-9/120563330_3251679801596421_5774388050002439408_n.jpg?stp=cp0_dst-jpg_e15_fr_q65&_nc_cat=103&ccb=1-6&_nc_sid=dd9801&efg=eyJpIjoidCJ9&_nc_ohc=Xa5gJQfuKkkAX9LvZS3&_nc_ht=scontent-iad3-1.xx&oh=00_AT9PzXjneY7V8ieyvVvQJBn6SXp5jA-PXhGrFK7MNzgZQQ&oe=62987064',
        category:"bunny",
        name:"Black Goosh",
        owner:"Jubina",
        price:"40,000"
    };

    const items = state.items || [];

    return(
        <ScrollView>
            <Header navigation={navigation}/>
            <View>
                <View>
                    <View style={{marginBottom: 20}}></View>


                    <View>
                        <View style={{marginLeft: 15, marginBottom: 10}}>
                            <Text style={styles.search_heading}>
                                Search by<Text style={{color:"#013587"}}> keyword:</Text>
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
                    {/*
                    <View>
                        <Text>
                            Select <Text> view</Text>
                        </Text>
                        <View>
                            <View>
                                <input type='checkbox'/> <Text>List</Text>
                            </View>
                            <View>
                                <input type='checkbox'/> <Text>Map</Text>
                            </View>
                        </View>
                    </View>
                    */}
                </View>

                <View>
                    <StoreItems
                        items={items}
                    />
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
  });

export default Store;