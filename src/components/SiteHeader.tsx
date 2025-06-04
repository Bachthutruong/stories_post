
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, Newspaper, UserCircle, LogIn, LogOut, Shield, Trophy } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const SiteHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: <Home /> },
    { href: '/posts', label: 'All Stories', icon: <Newspaper /> },
    { href: '/create-post', label: 'Create Story', icon: <PlusCircle /> },
    { href: '/lottery-winners', label: 'Lottery Winners', icon: <Trophy /> },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-headline text-primary hover:text-primary/80 transition-colors">
          Hẻm Story
        </Link>
        <nav className="flex items-center space-x-1 md:space-x-2">
          {navItems.map((item) => (
            <Button key={item.href} variant={pathname === item.href ? "secondary" : "ghost"} size="sm" asChild className="px-2 md:px-3">
              <Link href={item.href} className="flex items-center space-x-1">
                {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </Button>
          ))}

          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : user ? (
            <>
              {user.isAdmin && (
                <Button variant={pathname.startsWith('/admin') ? "secondary" : "ghost"} size="sm" asChild className="px-2 md:px-3">
                  <Link href="/admin/dashboard" className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground hidden lg:inline">Hi, {user.name.split(' ')[0]}</span>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center space-x-1 px-2 md:px-3">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild className="px-2 md:px-3">
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
