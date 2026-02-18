import Header from "../components/Header";
import { useState } from "react";
import api from "../api/http";
import { getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_item.png';
import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';






const Analytics = props => {
    const [userInfo, setUserInfo]           = useState('');
    const [imageDisplay, setImageDisplay]   = useState('');
    const [processed, setProcessed]         = useState(false);
    const [user, setUser]                   = useState('');
    const [items, setItems]                 = useState('');
    const [views, setViews]                 = useState([]);

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
        if(views.length == 0 && user ){
            api.get(`/api/analytics/profile/views/${user}`)
            .then( res => {
                setViews(res.data.profile_views)

            })
        }
        if(user && !items){
            api.get(`/api/profile/items/${user}`)
                    .then( res => {setItems(res.data.items.reverse())})
                    .catch(e => console.log(e))

        }
    }

    getUserInfo()

    function processUserInfo(info){
        const {class_year, profile_pic, } = info;
        setImageDisplay(profile_pic);

    }

    useState(()=>{},[views])


    const stat = {
        labels: ['Jan', 'Feb', 'Mar',
                'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
            label: 'Views',
            backgroundColor: 'rgba(75,192,192,1)',
            borderColor: 'rgba(0,0,0,1)',
            data: views
            }
        ]
    }

    const options = {
        legend: {
          display: false
        },
        scales: {
        }
      }


    return(
        <div className="">
            <Header/>
            <div className="grid grid-main justify-center w-full h-full px-5 md:px-10">
                <div className="col-span-8 gap-20 my-10 grid-cols-5 grid">
                    <div className="lg:col-span-2 col-span-5 flex flex-col  items-center">
                        <img
                                className="w-60 lg:mt-20 rounded-full h-60" 
                                src={imageDisplay || placeholder}/>
                    </div>
                    <div className="lg:col-span-3 col-span-5 h-fit grid gap-10 ">
                        <div className="text-3xl font-semibold">{user}'s analytics</div>
                        <div className="font-semibold">profile views</div>
                        <div className="p-2 rounded-lg border border-black">
                            
                            <Chart type='bar' data={stat} options={options} />
                        </div>
                        
                        <div className="font-semibold">Your item views</div>
                        <div className="rounded-lg overflow-y-scroll h-[200px] flex gap-5 flex-col p-5 border border-black">
                            {
                                items.length > 0 &&
                                items.sort((a, b) => b.views-a.views).map( item =>{
                                    return(
                                        <div className="flex items-center justify-between">
                                            <div className="flex  gap-5 items-center">
                                                <img className="w-10 rounded-lg h-10" src={item.image} />
                                                <div className="text-lg w-28 truncate text-ellipsis font-semibold">{item.name}</div>

                                            </div>
                                            <div>{item.views}  {item.views == 1 ? 'view' : 'views' }</div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>


                </div>
            </div>

        </div>
    )
}


export default Analytics;