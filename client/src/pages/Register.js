import { useState } from 'react';
import Form from '../components/Form';
import {useNavigate} from 'react-router-dom';
import api from '../api/http';
const Register = () =>{
    const navigate = useNavigate();
    const [error, setError] = useState();
    const address = '/api/auth/register'; 

    function userDetails(username,password){
        const data = {
            'username':username,
            'password':password,
        };

        api.post(address, data).then(res =>{
            // Server returns "successful" on success or "Error: User is already registered" on duplicate
            if (res.data && (res.data.includes("Error") || res.data.includes("error"))) {
                setError('Username has already been taken');
            } else if (res.data === "successful") {
                global.LOGGED_IN = true;
                // Wait a moment for session cookie to be set before navigating
                setTimeout(() => {
                    navigate('/profile', { replace: true });
                }, 100);
            } else {
                setError('Registration failed. Please try again.');
            }
        }).catch(err => {
            console.error('Registration error:', err);
            setError('Registration failed. Please check your connection and try again.');
        });
    }

    function reset(){
        setError(null)
    }

    return(
        <div className='grid grid-main justify-center w-full h-full items-center'>
            <div className='col-span-8 flex flex-col justify-center'>
                <div className='my-5 text-center text-5xl'>Welcome!</div>
                <div className='w-full my-10 h-[1px] bg-[gray]'></div>
                <Form
                    userDetails={userDetails}
                    reset={reset}
                    error={error}
                    name='Register'/>
            </div>
        </div>
        
    )
}


export default Register;