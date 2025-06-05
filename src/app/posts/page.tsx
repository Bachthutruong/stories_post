'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

interface Post {
    _id: string;
    postId: string;
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

export default function AllPostsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

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
            const res = await fetch(`/api/posts?${queryString}`);
            if (!res.ok) {
                throw new Error('Failed to fetch posts');
            }
            return res.json();
        },
    });

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Loading posts...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (data?.totalPages || 1)) {
            setPage(newPage);
        }
    };

    const renderPostCard = (post: Post) => (
        <Card key={post._id} className="w-full max-w-sm mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle>{post.description.substring(0, 50)}...</CardTitle>
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
            <h1 className="text-3xl font-bold text-center mb-8">All Posts</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                    placeholder="Search by name or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:flex-1"
                />
                <Select value={filterBy} onValueChange={(value) => setFilterBy(value === 'none' ? '' : value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="createdAt">Time Posted</SelectItem>
                        <SelectItem value="likes">Likes</SelectItem>
                        <SelectItem value="shares">Shares</SelectItem>
                        <SelectItem value="commentsCount">Comments</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {data?.posts.map(renderPostCard)}
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