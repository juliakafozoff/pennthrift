import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './styles/App.css';
import './styles/index.css'
import {
  BrowserRouter,
  Routes, 
  Route,
  Navigate,
  Outlet
} from "react-router-dom";
import api from './api/http';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Profile  from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Store from './pages/Store';
import NewItem from './pages/NewItem';
import User from './pages/User';
import Analytics from './pages/Analytics';
import Item from './pages/Item';
import Messages from './pages/Messages';
import Favourites from './pages/Favourites';

function App() {
  const [loggedin, setLoggedin] = useState(null)
  function getAuthentication(){
    
    api.post('/api/auth/').then(res => {
        global.LOGGED_IN = res.data[0];
        setLoggedin(res.data[0])
    });

  }




  const ProtectedRoute = ({redirectPath = '/login',children}) => {
        getAuthentication();
        if(loggedin!=null){
          if (!global.LOGGED_IN) {
            return <Navigate to={redirectPath} replace />;
          }

        }
        
        return children ? children : <Outlet />;
    
  };

  return (
    <div className="App w-full h-full">
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/store" element={<Store />} />
              <Route path="/user/:username"  element={<User />} />
              <Route path='/store/item'  element={<Item/>}/>
              <Route path='/store/item/:id' element={<Item />}/>
              <Route element={<ProtectedRoute  />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/newitem" element={<NewItem />} />
                <Route path="/profile/analytics" element={<Analytics/>} />
                <Route path="/profile/messages" element={<Messages/>} />
                <Route path="/profile/messages/:id" element={<Messages/>} />
                <Route path="/profile/favourites" element={<Favourites/>} />
              </Route>
              
          </Routes>
        </BrowserRouter>
    </div>
  );
}

/*
  
        
*/

export default App;
