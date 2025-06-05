'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Share2, MessageCircle } from 'lucide-react';

interface Post {
    _id: string;
    postId: string;
    title: string;
    description: string;
    images: { url: string; public_id: string }[];
    likes: number;
    shares: number;
    commentsCount: number;
    isFeatured: boolean;
    isHidden: boolean;
    userId: {
        name: string;
        phoneNumber: string;
        email: string;
    };
    createdAt: string;
}

interface HomePageData {
    featuredPosts: Post[];
    topLikedPosts: Post[];
    topSharedPosts: Post[];
    topCommentedPosts: Post[];
}

export default function HomePage() {
    const { data, isLoading, error } = useQuery<HomePageData, Error>({
        queryKey: ['homepageData'],
        queryFn: async () => {
            const res = await fetch('/api/home');
            if (!res.ok) {
                throw new Error('Failed to fetch homepage data');
            }
            return res.json();
        },
    });

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Loading homepage data...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    const renderPostCard = (post: Post) => (
        <Card key={post._id} className="w-full max-w-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>By {post.userId?.name || 'Anonymous'} - {new Date(post.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
                {post.images && post.images.length > 0 && (
                    <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                        <Image
                            src={post.images[0].url}
                            alt={post.description}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                )}
                <p className="text-sm text-gray-600">{post.description.substring(0, 100)}...</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center"><Heart className="w-4 h-4 mr-1" /> {post.likes}</span>
                    <span className="flex items-center"><Share2 className="w-4 h-4 mr-1" /> {post.shares}</span>
                    <span className="flex items-center"><MessageCircle className="w-4 h-4 mr-1" /> {post.commentsCount}</span>
                </div>
                <Link href={`/posts/${post._id}`}>
                    <Button variant="outline" size="sm">View</Button>
                </Link>
            </CardFooter>
        </Card>
    );

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">Welcome to Stories Post</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Featured Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.featuredPosts.map(renderPostCard)}
                </div>
            </section>

            <section>
                <Tabs defaultValue="likes" className="w-full">
                    <TabsList className="grid max-w-md mx-auto grid-cols-3">
                        <TabsTrigger value="likes">Top 6 Likes</TabsTrigger>
                        <TabsTrigger value="shares">Top 6 Shares</TabsTrigger>
                        <TabsTrigger value="comments">Top 6 Comments</TabsTrigger>
                    </TabsList>
                    <TabsContent value="likes">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                            {data?.topLikedPosts.map(renderPostCard)}
                        </div>
                    </TabsContent>
                    <TabsContent value="shares">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                            {data?.topSharedPosts.map(renderPostCard)}
                        </div>
                    </TabsContent>
                    <TabsContent value="comments">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                            {data?.topCommentedPosts.map(renderPostCard)}
                        </div>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
} 