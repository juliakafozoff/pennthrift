import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import api from "../api/http";
import { useNavigate } from "react-router-dom";
import placeholder from '../assets/placeholder_item.png';


const NewItem = props => {
    const [itemName, setItemName]           = useState('');
    const [description, setDescription]     = useState('');
    const [conditiion, setCondition]        = useState('');
    const [category, setCategory]           = useState('');
    const [price, setPrice]                 = useState(0);
    const [image, setImage]                 = useState( );
    const [imageDisplay, setImageDisplay]   = useState('');
    const [userID, setUserID]               = useState('');
    const [user, setUser]                   = useState('');
    const [error, setError]                 = useState('');
    const [clickable, setClickable]         = useState(true)
    const conditiions = ['New', 'Like new', 'Lightly used', 'Used'];
    const categories  = ['For Fun', 'Vehicle', 'Apparel', 'Tickets', 
                            'Furniture', 'Electronics', 'Books/ notes', 'Miscellaneous']
    const navigate = useNavigate();
    const inputRef = useRef()



    useEffect(() =>{
        if(!user && !userID){
            api.get('/api/auth/user').then( res => {
                setUser(res.data);
                api.get('/api/profile/' + res.data).then( res => {
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
            api.post('/api/file/upload', formData,{
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
    
                api.post('/api/profile/item/new', data).then(res => {
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
    return(
        <div className="">
            <Header/>
            <div className="grid grid-main mt-10 justify-center w-full h-full px-5 md:px-10">
                <div className="col-span-8 gap-20 grid grid-cols-3">
                    <div className="lg:col-span-1 col-span-3 grid gap-10">
                        <div className="gap-2 grid ">
                            <div className="font-semibold">
                                Item Name:
                            </div>
                            <input 
                                className="border py-1 font-semibold border-black outline-0 px-2 border-blak bg-[#F8F8F8]"
                                value={itemName}
                                onChange={(event) => setItemName(event.target.value)}/>
                        </div>
                        <img className="w-full max-w-[250px] h-64 border" src={imageDisplay || placeholder}/>

                        <div
                            onClick={() => handleClick()} 
                            className="text-blue-600 text-xs w-full flex justify-center cursor-pointer underline">
                            Upload an image
                            <input id='selectImage' 
                                hidden type="file" 
                                ref={inputRef}
                                accept="image/png, image/gif, image/jpeg"
                                onChange={event => processImage(inputRef.current.files[0]) } />
                        </div>
                    </div>
                    <div className="lg:col-span-2 col-span-3 h-fit grid gap-10">
                        <div className="flex gap-10 ">
                            <span className="w-28 font-semibold flex">
                                Item Description:
                            </span>
                            <span className="w-full">
                                <textarea
                                    style={{resize:"none"}} 
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="border py-1 h-36 w-full font-semibold border-black outline-0 px-2 border-blak bg-[#F8F8F8]"/>
                            </span>
                        </div>
                        <div className="flex gap-10 ">
                            <span className="w-28 font-semibold flex">
                                Price:
                            </span>
                            <span className="w-full">
                                
                                <input 
                                    className="border py-1 w-full font-semibold border-black outline-0 px-2 border-blak bg-[#F8F8F8]"
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}/>
                            </span>
                        </div>
                        <div className="lg:flex gap-10 ">
                            <span className="w-28 font-semibold flex">
                                Condition:
                            </span>
                            <span className="w-full flex gap-5">
                                
                                {
                                    conditiions.map( con => {
                                        return(
                                            <span className="text-sm gap-2 accent-black  cursor-pointer flex items-center"
                                                  onClick={() => setCondition(con)}> 
                                                <input className="" 
                                                    checked={con === conditiion} 
                                                    type='radio'/> 
                                                {con}  
                                            </span>
                                        )
                                    })
                                }
                                
                            </span>
                        </div>
                        <div className="flex gap-10 ">
                            <span className="w-28 font-semibold flex">
                                Category:
                            </span>
                            <span className="w-full grid grid-cols-2">
                                
                                {
                                    categories.map( cat => {
                                        return(
                                            <span className="text-sm gap-2 accent-black  cursor-pointer flex items-center"
                                                  onClick={() => setCategory(cat)}> 
                                                <input className="" 
                                                    checked={cat === category} 
                                                    type='checkbox'/> 
                                                {cat}  
                                            </span>
                                        )
                                    })
                                }
                            </span>
                        </div>
                    </div>
                    <div className='w-full col-span-3 flex justify-end'>
                        {
                            error && <div className="text-red-400 mx-10 font-semibold">{error}</div>
                        }
                        {
                            clickable && 
                            <img 
                                className="w-8 h-8 right-0 cursor-pointer" 
                                onClick={() => submit()}
                                src={require('../assets/plus.png')}/>
                        }
                        {
                            !clickable && <img 
                            className="w-8 h-10 right-0" 
                            src={require('../assets/loading.gif')}/>
                        }

                    </div>
                </div>
            </div>
        </div>
    )
}

export default NewItem;