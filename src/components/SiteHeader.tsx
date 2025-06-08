"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, Newspaper, UserCircle, LogIn, LogOut, Shield, Trophy, User } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const SiteHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: <Home /> },
    { href: '/posts', label: 'All Stories', icon: <Newspaper /> },
    { href: '/create-post', label: 'Create Story', icon: <PlusCircle /> },
    { href: '/lottery-winners', label: 'Lottery Winners', icon: <Trophy /> },
  ];

  const userNavItems = user ? [
    { href: `/users/${user?.user.id}`, label: 'Tài khoản', icon: <UserCircle /> },
    { href: `/users/${user?.user.id}/posts`, label: 'Bài viết của tôi', icon: <Newspaper /> },
  ] : [];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center relative justify-end md:justify-between">
        {/* Left section: Logo */}
        <Link href="/" className="text-2xl font-headline text-primary hover:text-primary/80 transition-colors z-10 hidden md:block">
          Story Post
        </Link>

        {/* Middle section: navItems - This will be centered */}
        <div className="hidden md:flex justify-center items-center flex-1">
          <nav className="flex items-center space-x-1 md:space-x-2">
            {navItems.map((item) => (
              <Button key={item.href} variant={pathname === item.href ? "secondary" : "ghost"} size="sm" asChild className="px-2 md:px-3">
                <Link href={item.href} className="flex items-center space-x-1">
                  {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        {/* Right section: User/Login/Admin */}
        <div className="flex items-center space-x-1 md:space-x-2 z-10">
          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : user ? (
            <>
              {user?.user.role === 'admin' && (
                <Button variant={pathname.startsWith('/admin') ? "secondary" : "ghost"} size="sm" asChild className="px-2 md:px-3">
                  <Link href="/admin/dashboard" className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2 md:px-3 flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Account</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="flex flex-col space-y-1">
                    {userNavItems.map((item) => (
                      <Button key={item.href} variant={pathname === item.href || (item.href !== `/users/${user?.user.id}/posts` && pathname.startsWith(item.href)) || (item.href === `/users/${user?.user.id}/posts` && pathname.startsWith(item.href)) ? "secondary" : "ghost"} size="sm" asChild className="w-full justify-start">
                        <Link href={item.href} className="flex items-center space-x-2">
                          {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <Button variant="default" size="sm" asChild className="px-2 md:px-3">
              <Link href="/auth/login" className="flex items-center space-x-1">
                <LogIn className="h-4 w-4" />
                <span className="hidden md:inline">Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
