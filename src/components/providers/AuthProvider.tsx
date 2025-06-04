
"use client";

import type { AuthenticatedUser } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data'; // For mock login

interface AuthContextType {
  user: AuthenticatedUser;
  login: (name: string, phone: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true to check local storage

  useEffect(() => {
    // Try to load user from localStorage on initial mount
    try {
      const storedUser = localStorage.getItem('hem-story-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      // Clear potentially corrupted storage
      localStorage.removeItem('hem-story-user');
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, phone: string): Promise<boolean> => {
    setIsLoading(true);
    // Mock login: find user in mockUsers
    const foundUser = mockUsers.find(u => u.name === name && u.phone === phone);
    if (foundUser && !foundUser.isLocked) {
      const authUser: AuthenticatedUser = { 
        id: foundUser.id, 
        name: foundUser.name, 
        phone: foundUser.phone,
        isAdmin: !!foundUser.isAdmin 
      };
      setUser(authUser);
      try {
        localStorage.setItem('hem-story-user', JSON.stringify(authUser));
      } catch (error) {
        console.error("Failed to save user to localStorage", error);
      }
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('hem-story-user');
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
