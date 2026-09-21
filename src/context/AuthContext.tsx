import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'voodooboomin_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error restoring auth state:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('VOODOO_BOOMIN_ADMIN_AUTH', 'true');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('VOODOO_BOOMIN_ADMIN_AUTH');
    }
  }, [user]);

  const signIn = async (customEmail?: string) => {
    setLoading(true);
    try {
      const email = customEmail || localStorage.getItem('VOODOO_BOOMIN_ADMIN_EMAIL') || 'glennbucky@gmail.com';
      const authenticatedUser: User = {
        uid: `user_${Date.now()}`,
        email: email,
        displayName: 'Voodoo Boomin',
        photoURL: null,
      };
      setUser(authenticatedUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
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
