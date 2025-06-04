"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface AppStats {
  totalPosts: number;
  totalUsers: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have administrative privileges.',
        variant: 'destructive',
      });
      router.push('/admin/login'); // Redirect to login if not admin
    } else {
      setIsAdmin(true);
    }
  }, [router, toast]);

  const { data: stats, isLoading: isStatsLoading, error: statsError } = useQuery<AppStats, Error>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return res.json();
    },
    enabled: isAdmin, // Only fetch if user is an admin
  });

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Checking access...</div>;
  }

  if (isStatsLoading) {
    return <div className="container mx-auto p-4 text-center">Loading statistics...</div>;
  }

  if (statsError) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error loading statistics: {statsError.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Manage Posts</CardTitle>
            <CardDescription>View, edit, delete, hide, or feature posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/posts">
              <Button className="w-full">Go to Posts</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>View, lock, or unlock user accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Go to Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Manage Reports</CardTitle>
            <CardDescription>Review and manage reported posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reports">
              <Button className="w-full">Go to Reports</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Manage Keywords</CardTitle>
            <CardDescription>Add, edit, or delete safe keywords.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/keywords">
              <Button className="w-full">Go to Keywords</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
            <CardDescription>View overall system statistics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/stats">
              <Button className="w-full">View Stats</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Lottery Management</CardTitle>
            <CardDescription>Create lottery programs and draw winners.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/lottery">
              <Button className="w-full">Manage Lottery</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-12">
        <h2 className="text-2xl font-semibold text-center">System Overview Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalPosts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalLikes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalShares}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats?.totalComments}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

