"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    const authToken = getCookie('authToken');
    const userData = getCookie('userData');
    const userRole = getCookie('userRole');

    if (authToken && userData && userRole) {
      try {
        const user = JSON.parse(userData as string);
        setUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        deleteCookie('authToken', { path: "/" });
        deleteCookie('userRole', { path: "/" });
        deleteCookie('userData', { path: "/" });
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
    setLoading(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const login = (userData: User) => {
    setCookie('authToken', 'user-token', { 
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });
    
    setCookie('userRole', userData.role, { 
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });
    
    setCookie('userData', JSON.stringify(userData), { 
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });
    
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    deleteCookie('authToken', { path: "/" });
    deleteCookie('userRole', { path: "/" });
    deleteCookie('userData', { path: "/" });
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout, refreshUser }}>
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
