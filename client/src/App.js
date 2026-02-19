import { useEffect, useState } from 'react';
import './styles/App.css';
import './styles/index.css';
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
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Store from './pages/Store';
import NewItem from './pages/NewItem';
import User from './pages/User';
import Analytics from './pages/Analytics';
import Item from './pages/Item';
import Messages from './pages/Messages';
import Favourites from './pages/Favourites';
import NotFound from './pages/NotFound';

// Simple ProtectedRoute - just checks auth and redirects if needed
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let retryAttempted = false;

    const checkAuth = async () => {
      const attempt = retryAttempted ? 'RETRY' : 'INITIAL';
      console.log(`🔵 [AUTH CHECK ${attempt}] Checking authentication for:`, location.pathname);
      console.log(`🔵 [AUTH CHECK ${attempt}] Cookies before request:`, document.cookie || 'NO COOKIES');
      console.log(`🔵 [AUTH CHECK ${attempt}] Cookie includes user_sid:`, document.cookie.includes('user_sid'));
      
      try {
        const res = await api.get('/api/auth/');
        console.log(`🟢 [AUTH CHECK ${attempt}] Response received:`, {
          authenticated: res.data.authenticated,
          user: res.data.user,
          fullResponse: res.data
        });
        
        if (mounted) {
          setIsAuthenticated(res.data.authenticated === true);
          setIsLoading(false);
          
          if (!res.data.authenticated) {
            console.warn(`⚠️ [AUTH CHECK ${attempt}] NOT AUTHENTICATED!`, {
              pathname: location.pathname,
              retryAttempted,
              cookies: document.cookie || 'NO COOKIES'
            });
          } else {
            console.log(`✅ [AUTH CHECK ${attempt}] AUTHENTICATED! User:`, res.data.user);
          }
          
          // If not authenticated and we haven't retried, wait and retry once
          // This handles the case where cookie hasn't propagated yet
          if (!res.data.authenticated && !retryAttempted && location.pathname === '/profile') {
            console.log('🟡 [AUTH CHECK] Will retry in 500ms...');
            retryAttempted = true;
            setTimeout(() => {
              if (mounted) {
                checkAuth();
              }
            }, 500);
            return;
          }
        }
      } catch (error) {
        console.error(`❌ [AUTH CHECK ${attempt}] Request failed:`, error);
        console.error(`❌ [AUTH CHECK ${attempt}] Error details:`, {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          cookies: document.cookie || 'NO COOKIES'
        });
        
        if (mounted) {
          // Retry once on error if we haven't already
          if (!retryAttempted && location.pathname === '/profile') {
            console.log('🟡 [AUTH CHECK] Will retry after error in 500ms...');
            retryAttempted = true;
            setTimeout(() => {
              if (mounted) {
                checkAuth();
              }
            }, 500);
            return;
          }
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-muted)]">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
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
          
          {/* Item routes */}
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
          
          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
