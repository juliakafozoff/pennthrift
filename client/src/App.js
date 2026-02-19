import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './styles/App.css';
import './styles/index.css'
import {
  BrowserRouter,
  Routes, 
  Route,
  Navigate,
  Outlet,
  useLocation
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
import NotFound from './pages/NotFound';

// ProtectedRoute component - properly handles async auth check with retry logic
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = auth, false = not auth
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let retries = 0;
    const maxRetries = 3;
    const retryDelay = 300; // ms between retries
    
    const checkAuth = async () => {
      try {
        const res = await api.post('/api/auth/');
        const authenticated = res.data[0] === true;
        
        if (mounted) {
          // If not authenticated but we haven't exhausted retries, try again
          // This handles race condition where session cookie might not be set yet
          if (!authenticated && retries < maxRetries && global.LOGGED_IN === true) {
            retries++;
            setTimeout(checkAuth, retryDelay);
            return;
          }
          
          global.LOGGED_IN = authenticated;
          setIsAuthenticated(authenticated);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          // Retry on network errors if we think we should be logged in
          if (retries < maxRetries && global.LOGGED_IN === true) {
            retries++;
            setTimeout(checkAuth, retryDelay);
            return;
          }
          global.LOGGED_IN = false;
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [location.pathname]); // Re-check when route changes

  // Show nothing while checking (prevents flash)
  if (isLoading || isAuthenticated === null) {
    return null;
  }

  // Redirect to login with return path if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children or outlet for nested routes
  return children ? children : <Outlet />;
};

function App() {
  return (
    <div className="App w-full h-full">
      <BrowserRouter>
          <Routes>
              {/* Public routes */}
              <Route path="/" element={<Welcome />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/store" element={<Store />} />
              <Route path="/user/:username" element={<User />} />
              
              {/* Item routes - redirect /store/item to /store if no ID */}
              <Route path="/store/item" element={<Navigate to="/store" replace />} />
              <Route path="/store/item/:id" element={<Item />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/newitem" element={<NewItem />} />
                <Route path="/profile/analytics" element={<Analytics />} />
                <Route path="/profile/messages" element={<Messages />} />
                <Route path="/profile/messages/:id" element={<Messages />} />
                <Route path="/profile/favourites" element={<Favourites />} />
              </Route>
              
              {/* 404 catch-all - must be last */}
              <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </div>
  );
}

/*
  
        
*/

export default App;
