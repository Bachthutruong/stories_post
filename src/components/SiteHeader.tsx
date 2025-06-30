"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, Newspaper, UserCircle, LogIn, LogOut, Shield, Trophy, User } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Memoize navigation items to prevent unnecessary re-renders
const NavItem = memo(({ href, isActive, icon, label }: {
  href: string;
  isActive: boolean;
  icon: React.ReactElement;
  label: string;
}) => (
  <Button 
    variant={isActive ? "secondary" : "ghost"} 
    size="sm" 
    asChild 
    className="px-2 md:px-3 transition-all duration-200"
  >
    <Link href={href} className="flex items-center space-x-1">
      {React.cloneElement(icon, { className: "h-4 w-4" })}
      <span className="hidden md:inline">{label}</span>
    </Link>
  </Button>
));

NavItem.displayName = 'NavItem';

const SiteHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首頁', icon: <Home /> },
    { href: '/posts', label: '所有夢想卡', icon: <Newspaper /> },
    { href: '/create-post', label: '上傳夢想卡', icon: <PlusCircle /> },
    { href: '/lottery-winners', label: '幸運卡友', icon: <Trophy /> },
  ];

  const userNavItems = user ? [
    { href: `/users/${user?.user.id}`, label: 'Tài khoản', icon: <UserCircle /> },
    { href: `/users/${user?.user.id}/posts`, label: 'Bài viết của tôi', icon: <Newspaper /> },
  ] : [];

  const isUserNavActive = (href: string) => {
    return pathname === href || 
           (href !== `/users/${user?.user.id}/posts` && pathname.startsWith(href)) || 
           (href === `/users/${user?.user.id}/posts` && pathname.startsWith(href));
  };

  return (
    <header className="bg-card shadow-md sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center relative justify-end md:justify-between">
        {/* Left section: Logo */}
        <Link 
          href="/" 
          className="text-2xl font-headline text-primary hover:text-primary/80 transition-colors duration-200 z-10 hidden md:block"
          prefetch={true}
        >
          希望夢想牆
        </Link>

        {/* Middle section: navItems - This will be centered */}
        <div className="flex justify-center items-center flex-1">
          <nav className="flex items-center space-x-1 md:space-x-2">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                isActive={pathname === item.href}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        </div>

        {/* Right section: User/Login/Admin */}
        <div className="flex items-center space-x-1 md:space-x-2 z-10">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <>
              {user?.user.role === 'admin' && (
                <Button 
                  variant={pathname.startsWith('/admin') ? "secondary" : "ghost"} 
                  size="sm" 
                  asChild 
                  className="px-2 md:px-3 transition-all duration-200"
                >
                  <Link href="/admin/dashboard" className="flex items-center space-x-1" prefetch={true}>
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2 md:px-3 flex items-center space-x-1 transition-all duration-200">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Account</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="flex flex-col space-y-1">
                    {userNavItems.map((item) => (
                      <Button 
                        key={item.href} 
                        variant={isUserNavActive(item.href) ? "secondary" : "ghost"} 
                        size="sm" 
                        asChild 
                        className="w-full justify-start transition-all duration-200"
                      >
                        <Link href={item.href} className="flex items-center space-x-2" prefetch={true}>
                          {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={logout} 
                      className="w-full justify-start flex items-center space-x-2 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            // <Button variant="default" size="sm" asChild className="px-2 md:px-3 transition-all duration-200">
            //   <Link href="/auth/login" className="flex items-center space-x-1" prefetch={true}>
            //     <LogIn className="h-4 w-4" />
            //     <span className="hidden md:inline">Login</span>
            //   </Link>
            // </Button>
            <></>
          )}
        </div>
      </div>
    </header>
  );
};

export default memo(SiteHeader);
