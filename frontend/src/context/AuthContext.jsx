import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and fetch latest user data from server on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken) {
        setToken(savedToken);
        // Set initial user from local storage to show something immediately
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        try {
          // Fetch latest profile from server
          const response = await api.get('/api/profile');
          
          if (response.data) {
            const freshUserData = response.data;
            setUser(prev => {
              const updated = { ...prev, ...freshUserData };
              localStorage.setItem('user', JSON.stringify(updated));
              return updated;
            });
          }
        } catch (error) {
          console.error("AuthContext: Failed to sync user profile:", error);
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (userData, authToken) => {
    setToken(authToken);
    localStorage.setItem('token', authToken);
    
    // Set initial user data from login response
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    try {
      // Immediately fetch full profile to get avatar, etc.
      const response = await api.get('/api/profile');
      if (response.data) {
        const fullUser = { ...userData, ...response.data };
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
      }
    } catch (error) {
      console.error("Failed to fetch full profile after login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = useCallback((newUserData) => {
    setUser(prevUser => {
      const avatarChanged = typeof newUserData?.avatar === 'string' && newUserData.avatar !== prevUser?.avatar;
      const updated = {
        ...prevUser,
        ...newUserData,
        ...(avatarChanged ? { avatarVersion: Date.now() } : {}),
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

