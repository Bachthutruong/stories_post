
"use client";

import React from 'react'; // Added React import
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, Newspaper, UserCircle, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const SiteHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: <Home /> },
    { href: '/posts', label: 'All Posts', icon: <Newspaper /> },
    { href: '/posts/create', label: 'Create Post', icon: <PlusCircle /> },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-headline text-primary hover:text-primary/80 transition-colors">
          Hẻm Story
        </Link>
        <nav className="flex items-center space-x-2 md:space-x-4">
          {navItems.map((item) => (
            <Button key={item.href} variant={pathname === item.href ? "secondary" : "ghost"} size="sm" asChild>
              <Link href={item.href} className="flex items-center space-x-1">
                {React.cloneElement(item.icon, { className: "h-4 w-4"})}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </Button>
          ))}

          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : user ? (
            <>
              {user.isAdmin && (
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/dashboard" className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span className="hidden md:inline">Admin</span>
                    </Link>
                  </Button>
              )}
              <span className="text-sm text-muted-foreground hidden md:inline">Hi, {user.name.split(' ')[0]}</span>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center space-x-1">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/auth/login" className="flex items-center space-x-1">
                <LogIn className="h-4 w-4" />
                 <span className="hidden md:inline">Login</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
