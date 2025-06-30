'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import { LikeButton } from '@/components/LikeButton';
import { ShareButton } from '@/components/ui/share-button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

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

// Skeleton component for loading states
const PostCardSkeleton = () => (
    <Card className="w-full max-w-sm shadow-lg border-none animate-pulse h-full flex flex-col">
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex-grow">
            <Skeleton className="w-full h-48 mb-4 rounded-md" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
            </div>
        </CardFooter>
    </Card>
);

const HomePageContent = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const { data, isLoading, error } = useQuery<HomePageData, Error>({
        queryKey: ['homepageData'],
        queryFn: async () => {
            const res = await fetch('/api/home', {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch homepage data');
            }
            return res.json();
        },
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const handleShareClick = async (postId: string) => {
        try {
            const res = await fetch(`/api/posts/${postId}/share`, {
                method: 'POST',
            });
            if (!res.ok) {
                throw new Error('Failed to update share count');
            }
            const result = await res.json();
            toast({
                title: 'Shared!',
                description: result.message,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const renderPostCard = (post: Post) => (
        <Link href={`/posts/${post._id}`} key={post._id} className="block w-full max-w-sm h-full">
            <Card className="shadow-lg border-none hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <CardDescription>By {post.userId?.name || 'Anonymous'} - {new Date(post.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    {post.images && post.images.length > 0 && (
                        <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                            <Image
                                src={post.images[0].url}
                                alt={post.description}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={false}
                                loading="lazy"
                            />
                        </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-3 overflow-hidden">
                        {post.description.length > 100 ? `${post.description.substring(0, 100)}...` : post.description}
                    </p>
                </CardContent>
                <CardFooter 
                    className="flex justify-between items-center"
                    onClick={(e) => e.preventDefault()} // Prevent card click when interacting with buttons
                >
                    <div className="flex items-center space-x-2">
                        <LikeButton 
                            postId={post._id} 
                            initialLikes={post.likes} 
                            isInitiallyLiked={false} // TODO: Check actual like status based on user
                        />
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1">
                            <ShareButton
                                url={`/posts/${post._id}`}
                                title={post.title}
                                description={post.description}
                                variant="ghost"
                                size="sm"
                                showText={false}
                                onShare={() => handleShareClick(post._id)}
                            />
                            <span className="text-sm text-muted-foreground">{post.shares}</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.commentsCount}</span>
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );

    const renderSkeletonGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center auto-rows-fr">
            {Array.from({ length: 6 }).map((_, index) => (
                <PostCardSkeleton key={index} />
            ))}
        </div>
    );

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">Welcome to Stories Post</h1>

            <section className="mb-12 md:mx-20">
                <h2 className="text-2xl font-semibold mb-4 text-center">Featured Posts</h2>
                {isLoading ? (
                    renderSkeletonGrid()
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center auto-rows-fr">
                        {data?.featuredPosts?.map(renderPostCard)}
                    </div>
                )}
            </section>

            <section className="md:mx-20">
                <Tabs defaultValue="likes" className="w-full">
                    <TabsList className="grid max-w-md mx-auto grid-cols-3">
                        <TabsTrigger value="likes">Top 6 Likes</TabsTrigger>
                        <TabsTrigger value="shares">Top 6 Shares</TabsTrigger>
                        <TabsTrigger value="comments">Top 6 Comments</TabsTrigger>
                    </TabsList>
                    <TabsContent value="likes">
                        {isLoading ? (
                            renderSkeletonGrid()
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4 justify-items-center auto-rows-fr">
                                {data?.topLikedPosts?.map(renderPostCard)}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="shares">
                        {isLoading ? (
                            renderSkeletonGrid()
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4 justify-items-center auto-rows-fr">
                                {data?.topSharedPosts?.map(renderPostCard)}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="comments">
                        {isLoading ? (
                            renderSkeletonGrid()
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4 justify-items-center auto-rows-fr">
                                {data?.topCommentedPosts?.map(renderPostCard)}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
};

export default function HomePage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold text-center mb-8">Welcome to Stories Post</h1>
                                 <section className="mb-12 md:mx-20">
                     <h2 className="text-2xl font-semibold mb-4 text-center">Featured Posts</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center auto-rows-fr">
                         {Array.from({ length: 6 }).map((_, index) => (
                             <PostCardSkeleton key={index} />
                         ))}
                     </div>
                 </section>
            </div>
        }>
            <HomePageContent />
        </Suspense>
    );
} 