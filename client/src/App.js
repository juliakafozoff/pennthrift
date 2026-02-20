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
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
  return (
    <div className="App w-full h-full">
      <AuthProvider>
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
      </AuthProvider>
    </div>
  );
}

export default App;
