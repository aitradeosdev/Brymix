import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  company: string;
  name: string;
  role: string;
  settings: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      browser: boolean;
    };
    timezone: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false };
    case 'LOGOUT':
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    case 'REFRESH_TOKEN':
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<any>;
  register: (email: string, password: string, company: string, name: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              accessToken: token,
              refreshToken: localStorage.getItem('refreshToken') || '',
            },
          });
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        twoFactorToken,
      });

      if (response.data.requiresTwoFactor) {
        dispatch({ type: 'LOGIN_FAILURE' });
        return { requiresTwoFactor: true };
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (email: string, password: string, company: string, name: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        company,
        name,
      });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    dispatch({
      type: 'REFRESH_TOKEN',
      payload: {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};