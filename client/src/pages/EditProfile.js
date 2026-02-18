import Header from "../components/Header"
import { useState, useRef, useEffect } from "react";
import api from "../api/http";
import { editUserProfile, getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_user.png';
import { useNavigate } from "react-router-dom";

// TODO: pass user info through props instead of axios
const EditProfile = props => {
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
    const navigate = useNavigate();

    const getUserInfo = async () => {
        if (!userInfo) {
            const res = await api.get('/api/auth/user');
            setUser(res.data);
            if(user)setUserInfo(await getUserProfile(user));
        }
        if(userInfo && !processed){
            processUserInfo(userInfo);
            setProcessed(true);

        }
    }

    getUserInfo()
   
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
        {val:'Clothes'},
        {val:'Books/ notes'},
        {val:'Electronics'},
        {val:'Tickets'},
        {val:'Furniture'},
        {val:'Miscellaneous'}

    ]

    

    function save(){
        setLoading(true);
        if(image){
            var formData = new FormData();
            formData.append("file", image);

            api.post('/api/file/upload', formData,{
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
        <div>
            <Header/>
            <div className="grid grid-main justify-center w-full h-full px-5 md:px-10">
                <div className="col-span-8 gap-20 my-10 grid-cols-5 grid">
                    <div className="lg:col-span-2 col-span-5 flex flex-col  items-center">
                        <div className="flex mb-10 text-4xl"><div className="mr-2 h-fit font-semibold">{user}'s </div> profile</div>
                        <img
                            className="w-60 rounded-full h-60" 
                            src={imageDisplay || placeholder}/>
                        <div
                            onClick={() => handleClick()} 
                            className="text-blue-600 my-2 text-xs w-full flex justify-center cursor-pointer underline">
                            Upload an image
                            <input id='selectImage' 
                                hidden type="file" 
                                ref={inputRef}
                                accept="image/png, image/gif, image/jpeg"
                                onChange={event => processImage(inputRef.current.files[0]) } />
                        </div>
                        <textarea 
                            onChange={event => setBio(event.target.value)} 
                            value={bio} 
                            style={{resize:"none"}}
                            className="w-full border  h-20 p-5"/>
                    </div>
                    <div className="lg:col-span-3 col-span-5 h-fit grid gap-10 ">
                        <div className="">
                            <div className="font-semibold">My name is: <input value={user} className="bg-[#F8F8F8] ml-2 outline-0 border border-black px-2"/></div>
                        </div>
                        <div className="">
                            
                            <div className="font-semibold">I am class of:
                                <span className="inline-grid ml-5 font-normal">
                                    {
                                        uClassList.map( uc =>{
                                            return(
                                                <span key={uc.val} onClick={() => {setYear(uc.val)}} className="my-1">
                                                    <input className="mx-1" checked={uc.val === year} type='radio'/>
                                                    <span className="">{uc.val}</span>
                                                </span>
                                            )
                                        })
                                    }

                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold">
                               <span className="w-16 inline-table"> I’m most interested in:</span>
                                <span className="inline-grid grid-cols-2 gap-x-10 gap-y-2 grid-row-4 ml-5 font-normal">
                                    {
                                        interestsList.map( intr => {
                                            return(
                                                <span key={intr.val} onClick={() =>processInterests(intr.val)} className="">
                                                    <input checked={interests.includes(intr.val)} type='checkbox' className="h-4 w-4" />
                                                    <span className="ml-2">{intr.val}</span>
                                                </span>                                          
                                            )
                                        })
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="">
                            <div className="font-semibold">My venmo is:
                            <input value={venmo} onChange={(e) => setVenmo(e.target.value)} className="bg-[#F8F8F8] ml-2 outline-0 border border-black px-2"/></div>
                        </div>
                        <div>
                            {
                                !loading && 
                                    <div className="flex border-2 rounded w-fit px-5 cursor-pointer border-black flex" 
                                    onClick={() => save()}>Save</div>

                            }
                            {
                                loading && <img 
                                className="w-8 h-10 right-0" 
                                src={require('../assets/loading.gif')}/>
                            }
                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}

export default EditProfile;