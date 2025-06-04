
"use client";

import { useState, useMemo } from 'react';
import { mockUsers } from '@/lib/mock-data';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Search, Lock, Unlock, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers.map(u => ({...u, isLocked: u.isLocked || false }))); // Manage users state locally
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const handleToggleLock = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, isLocked: !u.isLocked } : u));
    const user = users.find(u => u.id === userId);
    toast({ title: "User Updated", description: `User ${user?.name} lock status changed.` });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline text-primary">Manage Users</h1>
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Search users by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {/* Placeholder for "Add User" button if needed later */}
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{user.email || 'N/A'}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="default" className="bg-primary/80">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isLocked ? (
                    <Badge variant="destructive">Locked</Badge>
                  ) : (
                    <Badge variant="outline" className="border-green-500 text-green-700">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleLock(user.id)}>
                        {user.isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                        {user.isLocked ? 'Unlock User' : 'Lock User'}
                      </DropdownMenuItem>
                       {/* Placeholder for "View User Posts" or "Edit User" */}
                       <DropdownMenuItem disabled>
                         <UserCheck className="mr-2 h-4 w-4" /> View Details (Soon)
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

