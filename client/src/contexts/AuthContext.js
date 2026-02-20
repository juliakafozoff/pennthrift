import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkAuthTimeoutRef = useRef(null);
  const checkAuthInFlightRef = useRef(false); // Guard to prevent concurrent requests

  const checkAuth = async (force = false) => {
    // If a check is already in flight and not forced, return early
    if (checkAuthInFlightRef.current && !force) {
      console.log('🔵 [AUTH CONTEXT] Auth check already in flight, skipping...');
      return { authenticated: isAuthenticated, user };
    }

    checkAuthInFlightRef.current = true;
    
    try {
      console.log('🔵 [AUTH CONTEXT] Checking authentication...');
      // Use canonical /api/auth/me endpoint to get current authenticated user from session
      const res = await api.get('/api/auth/me');
      
      const authenticated = res.data.authenticated === true;
      const authUser = res.data.user || null;
      
      console.log('🔵 [AUTH CONTEXT] Auth check result:', {
        authenticated,
        user: authUser?.username || null
      });
      
      setIsAuthenticated(authenticated);
      setUser(authUser);
      setIsLoading(false);
      
      return { authenticated, user: authUser };
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return { authenticated: false, user: null };
    } finally {
      checkAuthInFlightRef.current = false;
    }
  };

  const logout = async () => {
    console.log('🔴 [AUTH CONTEXT] Logout called');
    
    // Check if current user is demo user
    const isDemoUser = user?.username === 'demo' || user?.isDemo === true;
    
    // Clear any pending auth checks
    if (checkAuthTimeoutRef.current) {
      clearTimeout(checkAuthTimeoutRef.current);
      checkAuthTimeoutRef.current = null;
    }
    
    // Immediately set auth state to false
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear demo session storage
    if (typeof window !== 'undefined') {
      const sessionId = sessionStorage.getItem('demoSessionId');
      if (sessionId) {
        // Clear localStorage flags for this session
        localStorage.removeItem(`demoConciergeOpened:${sessionId}`);
        // Clear sessionStorage
        sessionStorage.removeItem('demoSessionId');
      }
      // Also clear any old demoConciergeOpened keys (cleanup)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('demoConciergeOpened:')) {
          localStorage.removeItem(key);
        }
      });
      // Clear demo favorites seeded flag
      sessionStorage.removeItem('demoFavoritesSeeded');
      // Clear demo avatar customized flag
      sessionStorage.removeItem('demoAvatarCustomized');
    }
    
    try {
      if (isDemoUser) {
        // Call demo logout endpoint to wipe chat data
        await api.post('/api/auth/demo/logout', {}, { withCredentials: true });
        console.log('🟢 [AUTH CONTEXT] Demo logout API call successful - chat data wiped');
      } else {
        // Normal logout
        await api.post('/api/auth/logout', {}, { withCredentials: true });
        console.log('🟢 [AUTH CONTEXT] Logout API call successful');
      }
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Logout API call failed:', error);
      // Still clear local state even if API call fails
    }
    
    // Force a fresh auth check to confirm logout (force=true to bypass in-flight guard)
    await checkAuth(true);
  };

  // Generate or retrieve demo session ID
  const getDemoSessionId = () => {
    if (typeof window === 'undefined') return null;
    let sessionId = sessionStorage.getItem('demoSessionId');
    if (!sessionId) {
      // Generate UUID v4
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      sessionStorage.setItem('demoSessionId', sessionId);
    }
    return sessionId;
  };

  const demoLogin = async () => {
    console.log('🟡 [AUTH CONTEXT] Demo login called');
    
    try {
      const res = await api.post('/api/auth/demo', {}, { withCredentials: true });
      
      if (res.data.success) {
        // Generate/retrieve demo session ID
        getDemoSessionId();
        
        // Clear avatar customized flag on new login (allows default avatar to be set)
        // This ensures that after logout/login, default avatar is restored
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('demoAvatarCustomized');
        }
        
        // Refresh auth state
        await checkAuth(true);
        console.log('🟢 [AUTH CONTEXT] Demo login successful');
        return { success: true, user: res.data.user };
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Demo login error:', error);
      throw error;
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
    
    return () => {
      // Cleanup on unmount
      if (checkAuthTimeoutRef.current) {
        clearTimeout(checkAuthTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    checkAuth,
    logout,
    demoLogin,
    getDemoSessionId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

