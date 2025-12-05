'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  entityId?: string; // For customers, their Metronome entity ID
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always set as admin user - no authentication needed for demo
  const defaultUser: User = {
    id: 'admin-1',
    email: 'admin@metronome.local',
    name: 'Admin User',
    role: 'admin',
  };

  const [user] = useState<User>(defaultUser);
  const [isLoading] = useState(false);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // No-op: always logged in as admin
    return true;
  };

  const logout = () => {
    // No-op: stay logged in
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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


