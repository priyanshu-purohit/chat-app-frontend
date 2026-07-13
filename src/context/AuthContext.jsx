import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session Restoration: On app load, check if we have a token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        socketService.connect(token);

        const response = await api.get('/auth/me');
        console.log(response);
        setUser(response.data.username);
      }
      catch (error) {
        console.error('Session restoration failed:', error);
        logout();
      }
      finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Token Expiration Listener: Listen for "auth-expired" event from Axios interceptor
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    }


  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { token, username: userData } = response.data;

      localStorage.setItem('token', token);
      setUser(userData);

      // Hook up real-time websocket
      socketService.connect(token);

      return { success: true };
    }
    catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  };

  const register = async (username, email, password) => {

    try {
      const response = await api.post('/auth/register', { username, email, password });

      const { token, username: userData } = response.data;

      localStorage.setItem('token', token);
      setUser(userData);

      // Hook up real-time websocket
      socketService.connect(token);

      return { success: true };
    }
    catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socketService.disconnect();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume the auth context in any component
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
