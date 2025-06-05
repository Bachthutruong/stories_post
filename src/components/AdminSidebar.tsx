"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Users, ShieldAlert, ListFilter, Award, Settings } from 'lucide-react';
import React from 'react';

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

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground p-4 space-y-2 border-r border-sidebar-border h-full fixed top-0 left-0 pt-[calc(theme(spacing.16)+theme(spacing.4))] md:pt-16"> {/* Adjust pt to be below header */}
      <h2 className="text-lg font-semibold font-headline text-sidebar-primary mb-4">Admin Panel</h2>
      <nav className="flex flex-col space-y-1">
        {adminNavItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) ? 'secondary' : 'ghost'}
            asChild
            className="w-full justify-start"
          >
            <Link href={item.href} className="flex items-center space-x-2">
              {React.cloneElement(item.icon, { className: "h-4 w-4 text-[#2D8DD2]" })}
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
