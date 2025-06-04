
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAppStats } from "@/lib/mock-data";
import type { AppStats } from "@/lib/types";
import { BarChart, Users, FileText, Share2, MessageSquare, ThumbsUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const chartConfig = {
  posts: { label: "Posts", color: "hsl(var(--chart-1))" },
  users: { label: "Users", color: "hsl(var(--chart-2))" },
  shares: { label: "Shares", color: "hsl(var(--chart-3))" },
  comments: { label: "Comments", color: "hsl(var(--chart-4))" },
  likes: { label: "Likes", color: "hsl(var(--chart-5))" },
};

const pieChartData = [
  { name: 'Shares', value: mockAppStats.totalShares, fill: "hsl(var(--chart-3))" },
  { name: 'Comments', value: mockAppStats.totalComments, fill: "hsl(var(--chart-4))" },
  { name: 'Likes', value: mockAppStats.totalLikes, fill: "hsl(var(--chart-5))" },
];

export default function AdminDashboardPage() {
  const stats: AppStats = mockAppStats; // In a real app, fetch this data

  const barChartData = [
    { name: "Total", posts: stats.totalPosts, users: stats.totalUsers },
  ];


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline text-primary">Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">All stories submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered and guest contributors</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes}</div>
             <p className="text-xs text-muted-foreground">Across all posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShares}</div>
             <p className="text-xs text-muted-foreground">Across all posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">Across all posts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posts vs Users Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="posts" fill="var(--color-posts)" radius={4} />
                  <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interaction Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                     {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for recent activity or other relevant admin info */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon: A feed of recent posts, comments, and reports.</p>
        </CardContent>
      </Card>
    </div>
  );
}

