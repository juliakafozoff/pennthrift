import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkAuthTimeoutRef = useRef(null);

  const checkAuth = async () => {
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
    }
  };

  const logout = async () => {
    console.log('🔴 [AUTH CONTEXT] Logout called');
    
    // Clear any pending auth checks
    if (checkAuthTimeoutRef.current) {
      clearTimeout(checkAuthTimeoutRef.current);
      checkAuthTimeoutRef.current = null;
    }
    
    // Immediately set auth state to false
    setIsAuthenticated(false);
    setUser(null);
    
    try {
      await api.post('/api/auth/logout', {}, { withCredentials: true });
      console.log('🟢 [AUTH CONTEXT] Logout API call successful');
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Logout API call failed:', error);
      // Still clear local state even if API call fails
    }
    
    // Force a fresh auth check to confirm logout
    await checkAuth();
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
    logout
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

