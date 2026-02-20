import { useEffect, useRef } from 'react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UnreadProvider, useUnread } from './contexts/UnreadContext';
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

// Simple ProtectedRoute - uses AuthContext
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

// Component to initialize unreadCounts on demo login
const UnreadInitializer = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { setUnreadCounts } = useUnread();
  const initializedRef = useRef(false);
  const lastDemoUsernameRef = useRef(null);

  useEffect(() => {
    const initializeUnreadOnDemoLogin = async () => {
      // Only run for demo users
      const isDemoUser = user?.username === 'demo' || user?.isDemo === true;
      
      // Reset initialized flag when user logs out or switches away from demo
      if (!isAuthenticated || !isDemoUser) {
        if (lastDemoUsernameRef.current && (!isDemoUser || !isAuthenticated)) {
          // User logged out or switched away from demo - reset flag for next login
          initializedRef.current = false;
          lastDemoUsernameRef.current = null;
        }
        return;
      }

      // Track when demo user changes (new login)
      const currentDemoUsername = user?.username;
      if (lastDemoUsernameRef.current !== currentDemoUsername) {
        // New demo login - reset initialized flag
        initializedRef.current = false;
        lastDemoUsernameRef.current = currentDemoUsername;
      }

      // Only initialize once per demo login session
      if (initializedRef.current) {
        console.log('[UNREAD INIT] Already initialized, skipping');
        return;
      }

      // Check if concierge has been opened this session FIRST
      if (typeof window !== 'undefined') {
        const sessionId = sessionStorage.getItem('demoSessionId');
        const conciergeOpened = sessionId && localStorage.getItem(`demoConciergeOpened:${sessionId}`) === '1';
        
        if (conciergeOpened) {
          // Concierge already opened, don't show red dot
          console.log('[UNREAD INIT] Concierge already opened (flag set), setting unreadCounts to []');
          console.log('[SETUNREAD] UnreadInitializer setUnreadCounts([])');
          setUnreadCounts([]);
          initializedRef.current = true;
          return;
        }

        // Concierge not opened yet - ensure it exists and get conversationId
        try {
          console.log('[UNREAD INIT] Concierge not opened, ensuring concierge exists...');
          const api = (await import('./api/http')).default;
          const res = await api.post('/api/auth/demo/ensure-concierge-only', {}, { withCredentials: true });
          
          if (res.data.success && res.data.conversationId) {
            const conversationId = res.data.conversationId;
            
            // Double-check flag wasn't set while we were fetching (race condition guard)
            const currentSessionId = sessionStorage.getItem('demoSessionId');
            const flagNowSet = currentSessionId && localStorage.getItem(`demoConciergeOpened:${currentSessionId}`) === '1';
            
            if (flagNowSet) {
              console.log('[UNREAD INIT] Flag was set while fetching, skipping unreadCounts initialization');
              setUnreadCounts([]);
            } else {
              // Set unreadCounts to include concierge conversation
              console.log('[UNREAD INIT] Initialized unreadCounts with concierge conversationId:', conversationId);
              console.log('[SETUNREAD] UnreadInitializer setUnreadCounts([conversationId])');
              setUnreadCounts([conversationId]);
            }
            initializedRef.current = true;
          }
        } catch (error) {
          console.error('[UNREAD INIT] Error ensuring concierge:', error);
          // On error, don't set unreadCounts (let Messages.js handle it)
        }
      }
    };

    initializeUnreadOnDemoLogin();
  }, [user?.username, isAuthenticated, setUnreadCounts]); // Only depend on user change, not route changes

  return <>{children}</>;
};

function App() {
  return (
    <div className="App w-full h-full">
      <AuthProvider>
        <UnreadProvider>
          <UnreadInitializer>
            <BrowserRouter>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/store" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/store" element={<Store />} />
          <Route path="/user/:username" element={<User />} />
          
          {/* Item routes */}
          <Route path="/store/item" element={<Navigate to="/store" replace />} />
          <Route path="/store/item/:id" element={<Item />} />
          
          {/* Messages routes - accessible to guests for trial */}
          <Route path="/profile/messages" element={<Messages />} />
          <Route path="/profile/messages/:id" element={<Messages />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/newitem" element={<NewItem />} />
            <Route path="/profile/analytics" element={<Analytics />} />
            <Route path="/profile/favourites" element={<Favourites />} />
          </Route>
          
          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </UnreadInitializer>
        </UnreadProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
