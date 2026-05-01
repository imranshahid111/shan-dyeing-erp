import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  isSplashLoading: boolean;
  login: (credentials: { email: string; password?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check localStorage for persisted session
    return localStorage.getItem('erp_auth') === 'true';
  });
  
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  useEffect(() => {
    // Handle splash screen timer (3 seconds)
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials: { email: string; password?: string }) => {
    try {
      const response = await apiClient.post<any, any>('/auth/login', credentials);
      const { token, user } = response;
      localStorage.setItem('erp_auth', 'true');
      localStorage.setItem('erp_token', token);
      localStorage.setItem('erp_user', JSON.stringify(user));
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('erp_auth');
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isSplashLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
