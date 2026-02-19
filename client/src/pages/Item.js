import api from "../api/http";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import StoreItems from '../components/StoreItems';
import placeholder from '../assets/placeholder_item.png';
import { getUserFavourites } from "../api/ProfileAPI";
import { normalizeImageUrl } from "../utils/imageUtils";




const Item = props => {

    const [userInfo, setUserInfo]           = useState('');
    const [item, setItem]                   = useState({});
    const [viewer, setViewer]               = useState();
    const [viewed, setViewed]               = useState(false);
    const [favourites, setFavourites]       = useState([]);
    const [similarItems, setSimilarItems ]  = useState([]);
    const { id } = useParams();
    const [stateId, setStateId]             = useState(id);
    const [processed, setProcessed] = useState(false)
    const navigate = useNavigate()

    // Redirect to store if no ID provided
    useEffect(() => {
        if (!id) {
            navigate('/store', { replace: true });
        }
    }, [id, navigate]);

    const getInfo = async () => {
        if (!id) return; // Safety check
        
        if (!item || !viewer) {
            try {
                const resU = await api.get('/api/auth/user');
                setViewer(resU.data);
                const resI = await api.get(`/api/item/${id}`);
                setItem(resI.data)
            } catch (error) {
                console.error('Error loading item:', error);
                // Redirect to store if item not found
                navigate('/store', { replace: true });
            }
        }
        if(viewer && !viewed && id){
            setViewed(true)
            updateViews(id)
        }
    }

    const updateViews = async(id) => {
        const url = `/api/analytics/item/views/${id}`;
        const res = await api.get(url)
        let views = res.data.views + 1;
        api.put(url,{views:views})
    }
    
    // Load item data when component mounts or id changes
    useEffect(() => {
        if (id) {
            getInfo();
        }
    }, [id]);

    
    const update = async(id) =>{
        if(viewer){
            
            await api.post('/api/profile/favourites/update',{itemID:id, username:viewer})
            refresh()
        }else{
            navigate('/login')
        }
    }
    
    const filter = (items) =>{
        let similar = []
        items.map( i => {
                
            if(i._id == item._id){
                return
            }
            if(i.owner == item.owner){
                similar.push(i)
                return
            }
            if(i.category == item.category){
                similar.push(i)
                return
            }
            
        } );
    
        return similar;
    }

    const fecthSimilar = () =>{
        if(similarItems.length === 0 ){
    
            api.get(`/api/item/all`)
                    .then( res => {setSimilarItems(filter(res.data))})
                    .catch(e => console.log(e))

        }
    }

    const refresh = async() => {
        if(viewer){
            const fav = await getUserFavourites(viewer);
            fav.map( f => {
                setFavourites([...favourites, f._id])
            });
            setProcessed(true)
        }
    }

    async function setUp(){
        if(viewer && favourites.length == 0 && !processed){
            const fav = await getUserFavourites(viewer);
            fav.map( f => {
                setFavourites([...favourites, f._id])
            });
            setProcessed(true)
        }
    }

   
    useEffect(() => {
        
        if((stateId != id) && stateId){
            window.location.reload()
        }
        fecthSimilar();
        setUp();
    },[similarItems,id, item, viewer, viewed, favourites, stateId]);


    const favourite = (id) =>{
        if(favourites.includes(id)){
            return require('../assets/favourite_red.png')
        }
        return require('../assets/favourite.png')
    }


    return(
        <div>
            <Header/>
            <div className="grid grid-m justify-center w-full h-full px-5 md:px-10">
                <div className="col-span-8 mt-20 lg:gap-20 grid grid-cols-6">
                    <div key={item._id}  className="border-2 h-[300px] w-full lg:col-span-2 col-span-6 p-5 border-[#368481]  ">
                        <img 
                            src={item.image ? normalizeImageUrl(item.image) : placeholder} 
                            className='w-full border-[#368481] rounded-lg border-2 h-[200px]'
                            onError={(e) => {
                                e.target.src = placeholder;
                            }}
                        />
                        <div className='flex mt-5 text-xs gap-5'>
                            <div className='font-bold'> 
                                {item.category}
                            </div>
                            <div className='flex gap-2 w-full flex-col'>
                                <div>{item.name}</div>
                                <div> ${parseFloat(item.price)}</div>
                                <div className='flex items-center  justify-between'> 
                                    <Link to={`/user/${item.owner}`} className='text-blue-600 w-18 truncate overflow-ellipsis underline'>@{item.owner}</Link>
                                    <img 
                                    onClick={() => update(item._id)}
                                    src={favourite(item._id)}  
                                    className='w-5 cursor-pointer h-5'/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 col-span-6">
                        <div className="font-semibold text-lg">
                            Similar Items
                        </div>
                        <StoreItems 
                            favourites={ favourites }
                            refresh= {refresh}
                            user={viewer}
                            data={similarItems}/>
                    </div>
                </div>

            </div>
        </div>
        
        
    )
}

export default Item;