"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { User2, Lock, Unlock } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import useDebounce from '@/hooks/useDebounce';

interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  role: 'user' | 'admin';
  isLocked: boolean;
  createdAt: string;
}

interface AllUsersData {
  users: User[];
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

export default function AdminManageUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user?.user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
        router.replace('/admin/login?redirect=/admin/users');
      }
    }
  }, [user, isAuthLoading, router, toast]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    params.set('page', page.toString());
    return params.toString();
  };

  useEffect(() => {
    if (!isAuthLoading && user?.user.role === 'admin') {
      const queryString = buildQueryString();
      router.push(`/admin/users?${queryString}`, { scroll: false });
    }
  }, [debouncedSearchQuery, page, user, isAuthLoading]);

  const { data, isLoading, error } = useQuery<AllUsersData, Error>({
    queryKey: ['adminUsers', debouncedSearchQuery, page],
    queryFn: async () => {
      const queryString = buildQueryString();
      const res = await fetch(`/api/admin/users?${queryString}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      return res.json();
    },
    enabled: !isAuthLoading && user?.user.role === 'admin',
  });

  const toggleLockMutation = useMutation({
    mutationFn: async (user: User) => {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isLocked: !user.isLocked }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user lock status');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({
        title: 'Success',
        description: data.message || 'User lock status updated successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
  }

  if (!user || user?.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading users...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Manage Users</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:flex-1"
        />
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.isLocked ? 'Locked' : 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleLockMutation.mutate(user)}
                      disabled={toggleLockMutation.isPending}
                    >
                      {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center space-x-4">
        <Button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="text-sm">Page {data?.currentPage} of {data?.totalPages}</span>
        <Button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= (data?.totalPages || 1)}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

