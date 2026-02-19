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

// ProtectedRoute component - uses Passport sessions via GET /api/auth
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = auth, false = not auth
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const checkAuth = async (isRetry = false) => {
      try {
        // Use GET endpoint with new response format: {authenticated: boolean, user: object|null}
        const res = await api.get('/api/auth/');
        const { authenticated, user: userData } = res.data;
        
        console.log('Auth check result:', { authenticated, user: userData, isRetry, retryCount });
        
        if (mounted) {
          setIsAuthenticated(authenticated);
          setUser(userData);
          setIsLoading(false);
          
          // If not authenticated and we haven't retried, wait and retry (for cookie propagation)
          if (!authenticated && !isRetry && retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              if (mounted) {
                checkAuth(true);
              }
            }, 500); // Wait 500ms before retry
            return;
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          // Retry on error if we haven't exceeded max retries
          if (!isRetry && retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              if (mounted) {
                checkAuth(true);
              }
            }, 500);
            return;
          }
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [location.pathname]); // Re-check when route changes

  // Show loading state while checking
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-muted)]">Loading...</div>
      </div>
    );
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
