"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Users, ShieldAlert, ListFilter, Award, Settings } from 'lucide-react';
import React, { memo } from 'react';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/admin/posts', label: 'Manage Posts', icon: <FileText /> },
  { href: '/admin/comments', label: 'Manage Comments', icon: <FileText /> },
  { href: '/admin/users', label: 'Manage Users', icon: <Users /> },
  { href: '/admin/reports', label: 'Manage Reports', icon: <ShieldAlert /> },
  { href: '/admin/keywords', label: 'Moderation Keywords', icon: <ListFilter /> },
  { href: '/admin/lottery', label: 'Lottery Programs', icon: <Award /> },
  // Add more admin links here, e.g., settings
  // { href: '/admin/settings', label: 'Settings', icon: <Settings /> },
];

// Memoized navigation item component
const AdminNavItem = memo(({ href, label, icon, isActive }: {
  href: string;
  label: string;
  icon: React.ReactElement;
  isActive: boolean;
}) => (
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    asChild
    className="w-full justify-start transition-all duration-200 hover:bg-sidebar-accent"
  >
    <Link 
      href={href} 
      className="flex items-center space-x-2"
      prefetch={true}
    >
      {React.cloneElement(icon, { className: "h-4 w-4 text-[#2D8DD2]" })}
      <span>{label}</span>
    </Link>
  </Button>
));

AdminNavItem.displayName = 'AdminNavItem';

const AdminSidebar = () => {
  const pathname = usePathname();

  // Optimized active check function
  const isActiveRoute = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full md:w-64 bg-sidebar text-sidebar-foreground p-4 space-y-2 md:border-r md:border-sidebar-border h-full md:fixed md:top-0 md:left-0 md:pt-16 transition-all duration-300">
      <h2 className="text-lg font-semibold font-headline text-sidebar-primary mb-4">Admin Panel</h2>
      <nav className="flex flex-col space-y-1">
        {adminNavItems.map((item) => (
          <AdminNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActiveRoute(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
};

export default memo(AdminSidebar);
