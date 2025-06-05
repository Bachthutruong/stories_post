"use client";

import type { AuthenticatedUser } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: AuthenticatedUser;
  login: (name: string, phone: string) => Promise<AuthenticatedUser | false>;
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

  const login = async (name: string, phone: string): Promise<AuthenticatedUser | false> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, phoneNumber: phone }),
      });

      if (response.ok) {
        const foundUser: AuthenticatedUser = await response.json();
        if (foundUser) {
          setUser(foundUser);
          try {
            localStorage.setItem('hem-story-user', JSON.stringify(foundUser));
          } catch (error) {
            console.error("Failed to save user to localStorage", error);
          }
          setIsLoading(false);
          return foundUser;
        }
      } else {
         // Handle non-OK responses (e.g., 401 Unauthorized, 400 Bad Request)
         // You might want to read the response body for a specific error message
         // const errorData = await response.json();
         console.error('Login failed with status:', response.status);
      }

    } catch (error) {
      console.error('Login failed due to network or other error:', error);
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
