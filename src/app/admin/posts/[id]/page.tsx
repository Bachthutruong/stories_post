"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult, UseQueryOptions } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { highlightSensitiveKeywords } from '@/lib/utils/keywordHighlighter';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

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
    status: 'approved' | 'pending_review' | 'rejected';
    userId: {
        _id: string;
        name: string;
        phoneNumber: string;
        email: string;
    };
    createdAt: string;
}

interface AdminPostDetailPageProps {
    params: { id: string };
}

export default function AdminPostDetailPage({ params }: AdminPostDetailPageProps) {
    const { id: postId } = params;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [editIsFeatured, setEditIsFeatured] = useState(false);
    const [editIsHidden, setEditIsHidden] = useState(false);
    const [editStatus, setEditStatus] = useState<Post['status']>('pending_review');

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [postToDeleteId, setPostToDeleteId] = useState<string | null>(null);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handlePrevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? (postData?.images.length || 1) - 1 : prevIndex - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === (postData?.images.length || 1) - 1 ? 0 : prevIndex + 1));
    };

    // Fetch sensitive keywords
    const { data: sensitiveKeywords, isLoading: isLoadingSensitiveKeywords } = useQuery<string[], Error>({
        queryKey: ['sensitiveKeywords'],
        queryFn: async () => {
            const res = await fetch('/api/admin/keywords?isSafe=false', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch sensitive keywords');
            }
            const data = await res.json();
            return data.keywords.map((k: { word: string }) => k.word);
        },
        enabled: !isAuthLoading && user?.user.role === 'admin',
    });

    const { data: postData, isLoading, error } = useQuery<Post, Error, Post, ['adminPost', string]>({
        queryKey: ['adminPost', postId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/posts/${postId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch post');
            }
            const data = await res.json();
            return data.post;
        },
        enabled: !isAuthLoading && user?.user.role === 'admin',
        onSuccess: (data: Post) => {
            setEditDescription(data.description);
            setEditIsFeatured(data.isFeatured);
            setEditIsHidden(data.isHidden);
            setEditStatus(data.status);
        },
    } as UseQueryOptions<Post, Error, Post, ['adminPost', string]>);

    const updatePostMutation = useMutation<{
        message: string;
        post: Post;
    }, Error, Partial<Post>>({
        mutationFn: async (updatedPost: Partial<Post>) => {
            const res = await fetch(`/api/admin/posts/${updatedPost._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(updatedPost),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update post');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminPost', postId] });
            toast({
                title: 'Success',
                description: data.message || 'Post updated successfully',
                variant: 'default',
            });
            setEditDescription(data.post.description);
            setEditIsFeatured(data.post.isFeatured);
            setEditIsHidden(data.post.isHidden);
            setEditStatus(data.post.status);
            setIsEditDialogOpen(false);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        },
    });

    const handleDeletePost = useMutation<{
        message: string;
    }, Error, string>({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/posts/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete post');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
            toast({
                title: 'Success',
                description: data.message || 'Post deleted successfully',
                variant: 'default',
            });
            router.push('/admin/posts'); // Redirect back to posts list
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        },
    });

    const handleEditSubmit = () => {
        if (postData) {
            updatePostMutation.mutate({
                _id: postData._id,
                description: editDescription,
                isFeatured: editIsFeatured,
                isHidden: editIsHidden,
                status: editStatus,
            });
        }
    };

    const handleDeleteClick = (postId: string) => {
        setPostToDeleteId(postId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (postToDeleteId) {
            handleDeletePost.mutate(postToDeleteId);
            setIsDeleteDialogOpen(false);
            setPostToDeleteId(null);
        }
    };

    if (isAuthLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading post details...</div>;
    }

    if (!user || user?.user.role !== 'admin') {
        return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    if (!postData) {
        return <div className="container mx-auto p-4 text-center text-gray-500">Post not found.</div>;
    }

    const post = postData;

    return (
        <div className="container mx-auto p-4">
            <Button variant="outline" className="mb-6" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Posts
            </Button>
            <h1 className="text-3xl font-bold text-center mb-8">Post Details (Admin View)</h1>

            <Card className="w-full mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle
                        dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                            ? { __html: highlightSensitiveKeywords(post.title || '', sensitiveKeywords) }
                            : undefined
                        }
                    >
                        {user?.user.role !== 'admin' || !sensitiveKeywords
                            ? post.title
                            : null
                        }
                    </CardTitle>
                    <CardDescription>
                        <span
                            dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                                ? { __html: highlightSensitiveKeywords(`By ${post.userId?.name || 'Anonymous'} (${post.userId?.phoneNumber || ''})`, sensitiveKeywords) }
                                : undefined
                            }
                        >
                            {user?.user.role !== 'admin' || !sensitiveKeywords
                                ? `By ${post.userId?.name || 'Anonymous'} (${post.userId?.phoneNumber || ''})`
                                : null
                            }
                        </span>
                        <br />
                        Post ID: {post.postId} - {new Date(post.createdAt).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {post.images && post.images.length > 0 && (
                        <div className="relative w-full h-80 mb-4 rounded-md overflow-hidden">
                            <Image
                                src={post.images[currentImageIndex].url}
                                alt={post.description}
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            {post.images.length > 1 && (
                                <>
                                    <button
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10"
                                        onClick={handlePrevImage}
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10"
                                        onClick={handleNextImage}
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                                        {currentImageIndex + 1} / {post.images.length}
                                    </div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                                        {post.images.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`w-3 h-3 rounded-full ${index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                                                onClick={() => setCurrentImageIndex(index)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <p className="text-sm text-gray-600 mb-2">Likes: {post.likes}, Shares: {post.shares}, Comments: {post.commentsCount}</p>
                    <p className="text-sm text-gray-600 mb-2">Featured: {post.isFeatured ? 'Yes' : 'No'}, Hidden: {post.isHidden ? 'Yes' : 'No'}</p>
                    <p className="text-sm text-gray-800 mt-2">
                        <span
                            dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                                ? { __html: highlightSensitiveKeywords(post.description || '', sensitiveKeywords) }
                                : undefined
                            }
                        >
                            {user?.user.role !== 'admin' || !sensitiveKeywords
                                ? post.description
                                : null
                            }
                        </span>
                    </p>
                    <p className="text-sm text-gray-800 mt-2">
                        Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.status === 'approved' ? 'bg-green-100 text-green-800' : post.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {post.status ? (post.status.replace(/_/g, ' ').charAt(0).toUpperCase() + post.status.replace(/_/g, ' ').slice(1)) : 'N/A'}
                        </span>
                    </p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                        if (postData) {
                            setEditDescription(postData.description);
                            setEditIsFeatured(postData.isFeatured);
                            setEditIsHidden(postData.isHidden);
                            setEditStatus(postData.status);
                        }
                        setIsEditDialogOpen(true);
                    }} disabled={updatePostMutation.isPending}>
                        Edit Post
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteClick(post._id)} disabled={handleDeletePost.isPending}>
                        Delete Post
                    </Button>
                </CardFooter>
            </Card>

            {/* Edit Post Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                        <DialogDescription>
                            Make changes to the post here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="description" className="text-right">Description</label>
                            <Textarea
                                id="description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="isFeatured" className="text-right">Featured</label>
                            <Checkbox
                                id="isFeatured"
                                checked={editIsFeatured}
                                onCheckedChange={(checked: boolean) => setEditIsFeatured(checked)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="isHidden" className="text-right">Hidden</label>
                            <Checkbox
                                id="isHidden"
                                checked={editIsHidden}
                                onCheckedChange={(checked: boolean) => setEditIsHidden(checked)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="status" className="text-right">Status</label>
                            <Select value={editStatus} onValueChange={(value: Post['status']) => setEditStatus(value)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending_review">Pending Review</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleEditSubmit} disabled={updatePostMutation.isPending}>
                            {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={handleDeletePost.isPending}
                        >
                            {handleDeletePost.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 