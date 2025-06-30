"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';

interface AppStats {
  totalPosts: number;
  totalUsers: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
}

// Skeleton component for loading stats
const StatCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-12 w-20" />
    </CardContent>
  </Card>
);

const AdminDashboardContent = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user?.user?.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
        router.replace('/admin/login?redirect=/admin/dashboard');
      }
    }
  }, [user, isAuthLoading, router, toast]);

  const { data: stats, isLoading: isStatsLoading, error: statsError } = useQuery<AppStats, Error>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return res.json();
    },
    enabled: !isAuthLoading && user?.user?.role === 'admin',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isAuthLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user?.user?.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
  }

  if (statsError) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500 mb-4">
          Error loading statistics: {statsError.message}
        </div>
        <div className="text-center">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const statsCards = [
    { title: 'Total Posts', value: stats?.totalPosts ?? 0, color: 'text-blue-600' },
    { title: 'Total Users', value: stats?.totalUsers ?? 0, color: 'text-green-600' },
    { title: 'Total Likes', value: stats?.totalLikes ?? 0, color: 'text-red-600' },
    { title: 'Total Shares', value: stats?.totalShares ?? 0, color: 'text-purple-600' },
    { title: 'Total Comments', value: stats?.totalComments ?? 0, color: 'text-orange-600' },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-center mb-6">System Overview Statistics</h2>
        
        {isStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsCards.map((stat, index) => (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${stat.color} transition-all duration-300`}>
                    {stat.value.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!isStatsLoading && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-16">
              <Link href="/admin/posts" className="flex flex-col items-center">
                <span className="text-sm">Manage</span>
                <span className="font-semibold">Posts</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16">
              <Link href="/admin/users" className="flex flex-col items-center">
                <span className="text-sm">Manage</span>
                <span className="font-semibold">Users</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16">
              <Link href="/admin/comments" className="flex flex-col items-center">
                <span className="text-sm">Manage</span>
                <span className="font-semibold">Comments</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16">
              <Link href="/admin/reports" className="flex flex-col items-center">
                <span className="text-sm">View</span>
                <span className="font-semibold">Reports</span>
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}

