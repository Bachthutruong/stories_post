'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Share2, MessageCircle, Flag } from 'lucide-react';

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
        _id: string;
        name: string;
        phoneNumber: string;
        email: string;
    };
    createdAt: string;
}

interface Comment {
    _id: string;
    postId: string;
    userId?: { _id: string; name: string; phoneNumber: string; email: string };
    name?: string;
    content: string;
    userIp: string;
    createdAt: string;
}

interface Like {
    _id: string;
    postId: string;
    userId?: { _id: string; name: string; phoneNumber: string; email: string };
    name?: string;
    userIp: string;
    createdAt: string;
}

const commentFormSchema = z.object({
    content: z.string().min(1, { message: 'Comment cannot be empty.' }),
    name: z.string().optional(),
    userIp: z.string().optional(), // In a real app, you'd get this server-side or from a proxy
});

const reportFormSchema = z.object({
    reason: z.string().min(10, { message: 'Reason must be at least 10 characters.' }),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;
type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.id as string;
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isLikersDialogOpen, setIsLikersDialogOpen] = useState(false);

    // Dummy authenticated user ID for testing purposes. Replace with actual auth context.
    const authenticatedUserId = '60d5ec49f0f9b3001c8e4d3a'; // Replace with a valid user ID from your DB if needed for testing auth

    const { data: post, isLoading: isPostLoading, error: postError } = useQuery<Post, Error>({
        queryKey: ['post', postId],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${postId}`);
            if (!res.ok) {
                throw new Error('Failed to fetch post details');
            }
            return res.json().then(data => data.post);
        },
    });

    const { data: comments, isLoading: isCommentsLoading, error: commentsError } = useQuery<Comment[], Error>({
        queryKey: ['postComments', postId],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${postId}/comments`);
            if (!res.ok) {
                throw new Error('Failed to fetch comments');
            }
            return res.json().then(data => data.comments);
        },
    });

    const { data: likers, isLoading: isLikersLoading, error: likersError } = useQuery<Like[], Error>({
        queryKey: ['postLikers', postId],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${postId}/like`);
            if (!res.ok) {
                throw new Error('Failed to fetch likers');
            }
            return res.json().then(data => data.likes);
        },
        enabled: isLikersDialogOpen, // Only fetch when dialog is open
    });

    const likeMutation = useMutation({
        mutationFn: async (payload: { userId?: string; name?: string; userIp?: string }) => {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update like status');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] }); // Invalidate post to get updated like count
            queryClient.invalidateQueries({ queryKey: ['postLikers', postId] });
            toast({
                title: 'Success',
                description: data.message,
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

    const shareMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/${postId}/share`, {
                method: 'POST',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to increment share count');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] }); // Invalidate post to get updated share count
            toast({
                title: 'Success',
                description: data.message,
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

    const commentForm = useForm<CommentFormValues>({
        resolver: zodResolver(commentFormSchema),
        defaultValues: { content: '', name: '', userIp: '' },
    });

    const onCommentSubmit = async (values: CommentFormValues) => {
        // Dummy IP address for demonstration. In a real app, get from request headers server-side.
        const userIp = values.userIp || '192.168.1.1';
        const payload = {
            ...values,
            userIp,
            userId: authenticatedUserId, // Use authenticatedUserId if available, otherwise it's optional
        };

        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                toast({
                    title: 'Success',
                    description: data.message,
                    variant: 'default',
                });
                commentForm.reset();
                setIsCommentDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
                queryClient.invalidateQueries({ queryKey: ['post', postId] }); // Update commentsCount
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to add comment.',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Comment submission failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    };

    const reportForm = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: { reason: '' },
    });

    const onReportSubmit = async (values: ReportFormValues) => {
        const payload = {
            ...values,
            userId: authenticatedUserId, // Optional, can be anonymous
        };

        try {
            const res = await fetch(`/api/posts/${postId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                toast({
                    title: 'Success',
                    description: data.message,
                    variant: 'default',
                });
                reportForm.reset();
                setIsReportDialogOpen(false);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to submit report.',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Report submission failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    };

    if (isPostLoading) {
        return <div className="container mx-auto p-4 text-center">Loading post details...</div>;
    }

    if (postError) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {postError.message}</div>;
    }

    if (!post) {
        return <div className="container mx-auto p-4 text-center">Post not found.</div>;
    }

    const isUserLoggedIn = !!authenticatedUserId; // Simple check for now

    return (
        <div className="container mx-auto p-4">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{post.description}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                        Posted by {post.userId?.name || 'Anonymous'} on {new Date(post.createdAt).toLocaleDateString()}
                        <br />
                        Post ID: {post.postId}
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
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                                    {post.images.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`w-3 h-3 rounded-full ${index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                                            onClick={() => setCurrentImageIndex(index)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-base text-gray-800 mb-4">{post.description}</p>

                    <div className="flex items-center justify-around border-t border-b py-3 mb-4">
                        <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => likeMutation.mutate({ userId: authenticatedUserId, userIp: '127.0.0.1' })} disabled={likeMutation.isPending}>
                                <Heart className="w-5 h-5" />
                            </Button>
                            <span>{post.likes}</span>
                            <Dialog open={isLikersDialogOpen} onOpenChange={setIsLikersDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="link" size="sm">View Likes</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>People Who Liked This Post</DialogTitle>
                                    </DialogHeader>
                                    <div className="h-60 overflow-y-auto">
                                        {isLikersLoading ? (
                                            <p>Loading likers...</p>
                                        ) : likersError ? (
                                            <p className="text-red-500">Error loading likers: {likersError.message}</p>
                                        ) : likers && likers.length > 0 ? (
                                            <ul>
                                                {likers.map((like) => (
                                                    <li key={like._id} className="py-1 border-b last:border-b-0">
                                                        {like.userId?.name || like.name || 'Anonymous'} (IP: {like.userIp})
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No one has liked this post yet.</p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => setIsLikersDialogOpen(false)}>Close</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => shareMutation.mutate()} disabled={shareMutation.isPending}>
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <span>{post.shares}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.commentsCount}</span>
                            <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="link" size="sm">Add Comment</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Your Comment</DialogTitle>
                                        <DialogDescription>
                                            {isUserLoggedIn ? (
                                                "You are logged in. Your comment will be associated with your account."
                                            ) : (
                                                "Enter your name to comment anonymously. Your IP address will be recorded."
                                            )}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4">
                                        {!isUserLoggedIn && (
                                            <div>
                                                <label htmlFor="commentName" className="block text-sm font-medium text-gray-700">Your Name</label>
                                                <Input id="commentName" {...commentForm.register('name')} />
                                                {commentForm.formState.errors.name && (
                                                    <p className="text-red-500 text-sm">{commentForm.formState.errors.name.message}</p>
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <label htmlFor="commentContent" className="block text-sm font-medium text-gray-700">Comment</label>
                                            <Textarea id="commentContent" {...commentForm.register('content')} />
                                            {commentForm.formState.errors.content && (
                                                <p className="text-red-500 text-sm">{commentForm.formState.errors.content.message}</p>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={commentForm.formState.isSubmitting}>Submit Comment</Button>
                                        </DialogFooter>
                                    </form>
                                    <h3 className="text-lg font-semibold mt-4">Comments ({comments?.length || 0})</h3>
                                    <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                                        {isCommentsLoading ? (
                                            <p>Loading comments...</p>
                                        ) : commentsError ? (
                                            <p className="text-red-500">Error loading comments: {commentsError.message}</p>
                                        ) : comments && comments.length > 0 ? (
                                            <ul>
                                                {comments.map((comment) => (
                                                    <li key={comment._id} className="py-2 border-b last:border-b-0">
                                                        <p className="text-sm font-semibold">{comment.userId?.name || comment.name || 'Anonymous'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()} (IP: {comment.userIp})</p>
                                                        <p className="text-gray-700 mt-1">{comment.content}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No comments yet. Be the first to comment!</p>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex items-center space-x-1">
                            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Flag className="w-5 h-5 text-red-500" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Report Post</DialogTitle>
                                        <DialogDescription>Please provide a reason for reporting this post.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-4">
                                        <div>
                                            <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700">Reason</label>
                                            <Textarea id="reportReason" {...reportForm.register('reason')} rows={4} />
                                            {reportForm.formState.errors.reason && (
                                                <p className="text-red-500 text-sm">{reportForm.formState.errors.reason.message}</p>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" variant="destructive" disabled={reportForm.formState.isSubmitting}>Submit Report</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            <span>Report</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 