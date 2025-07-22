'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import { LikeButton } from '@/components/LikeButton';
import { ShareButton } from '@/components/ui/share-button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import useDebounce from '@/hooks/useDebounce';
import { generatePostLuckyNumber } from '@/hooks/useLuckyNumber';

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

interface AllPostsData {
    posts: Post[];
    currentPage: number;
    totalPages: number;
    totalPosts: number;
}

// Skeleton component for loading states
const PostCardSkeleton = () => (
    <Card className="w-full max-w-sm mx-auto shadow-lg border-none animate-pulse h-full flex flex-col relative">
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

const AllPostsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [filterBy, setFilterBy] = useState(searchParams.get('filterBy') || '');
    const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
        if (filterBy) params.set('filterBy', filterBy);
        if (sortOrder) params.set('sortOrder', sortOrder);
        params.set('page', page.toString());
        return params.toString();
    };

    useEffect(() => {
        const queryString = buildQueryString();
        router.push(`/posts?${queryString}`, { scroll: false });
    }, [debouncedSearchQuery, filterBy, sortOrder, page]);

    const { data, isLoading, error } = useQuery<AllPostsData, Error>({
        queryKey: ['allPosts', debouncedSearchQuery, filterBy, sortOrder, page],
        queryFn: async () => {
            const queryString = buildQueryString();
            const res = await fetch(`/api/posts?${queryString}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch posts');
            }
            return res.json();
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 2 * 60 * 1000, // 2 minutes
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

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (data?.totalPages || 1)) {
            setPage(newPage);
        }
    };

    const renderPostCard = (post: Post) => (
        <Link href={`/posts/${post._id}`} key={post._id} className="block w-full max-w-sm mx-auto h-full">
            <Card className="shadow-lg border-none hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 h-full flex flex-col relative">
                {/* Lucky Number */}

                <CardHeader>
                    <div className="flex items-center justify-between bg-[#C6ECDE] px-3 py-2 rounded">
                        <div className="flex flex-col">
                            <CardTitle className="text-lg text-black m-0 p-0">{post.title}</CardTitle>
                        </div>
                        {/* Lấy 3 số cuối của postId */}
                        <span className="ml-4 bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold">
                            {(() => {
                                const match = post.postId.match(/(\d{3})$/);
                                return match ? match[1] : post.postId.slice(-3).padStart(3, '0');
                            })()}
                        </span>
                    </div>
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
        <div className="md:mx-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-fr">
            {Array.from({ length: 9 }).map((_, index) => (
                <PostCardSkeleton key={index} />
            ))}
        </div>
    );

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {/* <h1 className="text-3xl font-bold text-center mb-8">All Posts</h1> */}

            <div className="flex flex-col md:flex-row gap-4 mb-6 md:mx-24">
                <Input
                    placeholder="用姓名或電話尋找你的夢想卡"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:flex-1"
                />
                <Select value={filterBy} onValueChange={(value) => setFilterBy(value === 'none' ? '' : value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="篩選" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">無篩選</SelectItem>
                        <SelectItem value="createdAt">上傳時間</SelectItem>
                        <SelectItem value="likes">按讚</SelectItem>
                        <SelectItem value="shares">分享</SelectItem>
                        <SelectItem value="commentsCount">評論</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">優先最多</SelectItem>
                        <SelectItem value="asc">優先最少</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                renderSkeletonGrid()
            ) : (
                <div className="md:mx-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-fr">
                    {data?.posts?.map(renderPostCard)}
                </div>
            )}

            {!isLoading && (
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
            )}
        </div>
    );
};

export default function AllPostsPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-4">
                {/* <h1 className="text-3xl font-bold text-center mb-8">All Posts</h1> */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 md:mx-24">
                    <Skeleton className="h-10 md:flex-1" />
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[180px]" />
                </div>
                <div className="md:mx-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-fr">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <PostCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        }>
            <AllPostsContent />
        </Suspense>
    );
} 