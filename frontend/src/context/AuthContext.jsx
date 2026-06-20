import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';
const USER_TYPE_STORAGE_KEY = 'userType';

const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const persistAuth = (authToken, authUser, authUserType) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
  localStorage.setItem(USER_TYPE_STORAGE_KEY, authUserType);
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USER_TYPE_STORAGE_KEY);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [userType, setUserType] = useState(localStorage.getItem(USER_TYPE_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = getStoredUser();
    const storedUserType = localStorage.getItem(USER_TYPE_STORAGE_KEY);

    if (storedToken) {
      setToken(storedToken);

      if (storedUser) {
        setUser(storedUser);
      }

      if (storedUserType) {
        setUserType(storedUserType);
      }

      try {
        const response = await api.get('/auth/me');
        const currentUser = response.data.user;
        const currentUserType = currentUser.userType || storedUserType;

        setUser(currentUser);
        setUserType(currentUserType);
        persistAuth(storedToken, currentUser, currentUserType);
      } catch (error) {
        console.error('Auth check failed:', error);
        if ([401, 403].includes(error.response?.status)) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          setUserType(null);
        }
      }
    } else {
      clearStoredAuth();
    }
    setLoading(false);
  };

  const login = async (credentials, type) => {
    try {
      const endpoint = type === 'staff' ? '/auth/staff/login' : '/auth/student/login';
      const response = await api.post(endpoint, credentials);
      
      const { token: newToken, user: userData } = response.data;
      const authUser = { ...userData, userType: userData.userType || type };

      persistAuth(newToken, authUser, authUser.userType);
      setToken(newToken);
      setUser(authUser);
      setUserType(authUser.userType);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setUserType(null);
    }
  };

  const value = {
    user,
    userType,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isStaff: userType === 'staff',
    isStudent: userType === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
