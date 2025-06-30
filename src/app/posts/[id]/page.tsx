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
import { Heart, MessageCircle, Flag, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { ShareButton } from "@/components/ui/share-button";
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
    content: z.string().min(1, { message: '留言不能為空。' }),
    name: z.string().optional(),
    userIp: z.string().optional(), // In a real app, you'd get this server-side or from a proxy
});

const reportFormSchema = z.object({
    reason: z.string().min(10, { message: '原因至少需要10個字元。' }),
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

    // Generate lucky number for this post
    const postLuckyNumber = generatePostLuckyNumber(postId);

    const handlePrevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? (post?.images.length || 1) - 1 : prevIndex - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === (post?.images.length || 1) - 1 ? 0 : prevIndex + 1));
    };

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
                title: '成功',
                description: data.message,
                variant: 'default',
            });
        },
        onError: (error) => {
            toast({
                title: '錯誤',
                description: error.message || '發生未預期的錯誤。',
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
                title: '成功',
                description: data.message,
                variant: 'default',
            });
        },
        onError: (error) => {
            toast({
                title: '錯誤',
                description: error.message || '發生未預期的錯誤。',
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
                    title: '成功',
                    description: data.message,
                    variant: 'default',
                });
                commentForm.reset();
                setIsCommentDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
                queryClient.invalidateQueries({ queryKey: ['post', postId] }); // Update commentsCount
            } else {
                toast({
                    title: '錯誤',
                    description: data.message || '無法新增留言。',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Comment submission failed:', error);
            toast({
                title: '錯誤',
                description: error.message || '發生未預期的錯誤。',
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
                    title: '成功',
                    description: data.message,
                    variant: 'default',
                });
                reportForm.reset();
                setIsReportDialogOpen(false);
            } else {
                toast({
                    title: '錯誤',
                    description: data.message || '無法提交檢舉。',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Report submission failed:', error);
            toast({
                title: '錯誤',
                description: error.message || '發生未預期的錯誤。',
                variant: 'destructive',
            });
        }
    };

    if (isPostLoading) {
        return <div className="container mx-auto p-4"><div className="text-center">載入貼文中...</div></div>;
    }

    if (postError) {
        return <div className="container mx-auto p-4"><div className="text-center text-red-500">載入貼文錯誤：{postError.message}</div></div>;
    }

    if (!post) {
        return <div className="container mx-auto p-4"><div className="text-center">找不到貼文。</div></div>;
    }

    const isUserLoggedIn = !!authenticatedUserId;

    return (
        <div className="container mx-auto p-4 w-full">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header with post info and lucky number */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
                            <p className="text-sm text-gray-600">
                                發佈者 <span className="font-medium">{post.userId?.name || '匿名'}</span> 於 {new Date(post.createdAt).toLocaleDateString()}
                                <br />
                                貼文編號：<span className="font-mono text-blue-600">{post.postId}</span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-lg border border-yellow-200">
                            <Star className="w-5 h-5 text-yellow-600" />
                            <div className="text-right">
                                <div className="text-xs text-gray-600 font-medium">幸運號碼</div>
                                <div className="text-lg font-bold text-yellow-700">{postLuckyNumber}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content area - Facebook style layout */}
                <div className="flex flex-col lg:flex-row">
                    {/* Left column - Images */}
                    {post.images && post.images.length > 0 && (
                        <div className="lg:w-1/2 p-6">
                            <div className="relative w-full h-96 lg:h-[500px] rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                    src={post.images[currentImageIndex].url}
                                    alt={post.description}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="transition-opacity duration-300"
                                />
                                {post.images.length > 1 && (
                                    <>
                                        <button
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all duration-200 z-10"
                                            onClick={handlePrevImage}
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all duration-200 z-10"
                                            onClick={handleNextImage}
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                                            {currentImageIndex + 1} / {post.images.length}
                                        </div>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                                            {post.images.map((_, index) => (
                                                <button
                                                    key={index}
                                                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                                        index === currentImageIndex 
                                                            ? 'bg-blue-500 scale-110' 
                                                            : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                                                    }`}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right column - Content and interactions */}
                    <div className={`${post.images && post.images.length > 0 ? 'lg:w-1/2' : 'w-full'} p-6`}>
                        {/* Post description */}
                        <div className="mb-6">
                            <p className="text-base text-gray-800 leading-relaxed">{post.description}</p>
                        </div>

                        {/* Interaction buttons */}
                        <div className="border-t border-b border-gray-200 py-3 mb-6">
                            <div className="flex items-center justify-around">
                                {/* Like button */}
                                <div className="flex items-center space-x-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => likeMutation.mutate({ userId: authenticatedUserId, userIp: '127.0.0.1' })} 
                                        disabled={likeMutation.isPending}
                                        className="hover:bg-red-50"
                                    >
                                        <Heart className="w-5 h-5 mr-1" />
                                        讚 ({post.likes})
                                    </Button>
                                    <Dialog open={isLikersDialogOpen} onOpenChange={setIsLikersDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="link" size="sm" className="text-sm text-gray-600 hover:text-blue-600">
                                                查看按讚
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>按讚的人</DialogTitle>
                                            </DialogHeader>
                                            <div className="h-60 overflow-y-auto">
                                                {isLikersLoading ? (
                                                    <p>載入按讚用戶中...</p>
                                                ) : likersError ? (
                                                    <p className="text-red-500">載入按讚用戶錯誤：{likersError.message}</p>
                                                ) : likers && likers.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {likers.map((like) => (
                                                            <li key={like._id} className="py-2 px-3 bg-gray-50 rounded border-b last:border-b-0">
                                                                <div className="font-medium">{like.userId?.name || like.name || '匿名'}</div>
                                                                <div className="text-xs text-gray-500">IP: {like.userIp}</div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-center text-gray-500">還沒有人按讚這篇貼文。</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={() => setIsLikersDialogOpen(false)}>關閉</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Share button */}
                                <div className="flex items-center space-x-2">
                                    <ShareButton
                                        url={typeof window !== 'undefined' ? window.location.href : ""}
                                        title={post.title}
                                        description={post.description}
                                        variant="ghost"
                                        size="sm"
                                        className="hover:bg-blue-50"
                                        showText={true}
                                        onShare={shareMutation.mutate}
                                    />
                                    <span className="text-sm text-gray-600">({post.shares})</span>
                                </div>

                                {/* Comment button */}
                                <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="hover:bg-green-50">
                                            <MessageCircle className="w-5 h-5 mr-1" />
                                            留言 ({post.commentsCount})
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>新增您的留言</DialogTitle>
                                            <DialogDescription>
                                                {isUserLoggedIn ? (
                                                    "您已登入。您的留言將與您的帳戶關聯。"
                                                ) : (
                                                    "輸入您的姓名以匿名留言。您的IP位址將被記錄。"
                                                )}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4">
                                            {!isUserLoggedIn && (
                                                <div>
                                                    <label htmlFor="commentName" className="block text-sm font-medium text-gray-700 mb-1">您的姓名</label>
                                                    <Input id="commentName" {...commentForm.register('name')} />
                                                    {commentForm.formState.errors.name && (
                                                        <p className="text-red-500 text-sm mt-1">{commentForm.formState.errors.name.message}</p>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <label htmlFor="commentContent" className="block text-sm font-medium text-gray-700 mb-1">留言</label>
                                                <Textarea 
                                                    id="commentContent" 
                                                    {...commentForm.register('content')} 
                                                    rows={3}
                                                    placeholder="在此輸入您的留言..."
                                                />
                                                {commentForm.formState.errors.content && (
                                                    <p className="text-red-500 text-sm mt-1">{commentForm.formState.errors.content.message}</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={commentForm.formState.isSubmitting}>
                                                    {commentForm.formState.isSubmitting ? '發佈中...' : '發佈留言'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                {/* Report button */}
                                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="hover:bg-red-50">
                                            <Flag className="w-5 h-5 mr-1 text-red-500" />
                                            檢舉
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>檢舉貼文</DialogTitle>
                                            <DialogDescription>請提供檢舉此貼文的原因。</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-4">
                                            <div>
                                                <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700 mb-1">原因</label>
                                                <Textarea 
                                                    id="reportReason" 
                                                    {...reportForm.register('reason')} 
                                                    rows={4} 
                                                    placeholder="請描述您檢舉此貼文的原因..."
                                                />
                                                {reportForm.formState.errors.reason && (
                                                    <p className="text-red-500 text-sm mt-1">{reportForm.formState.errors.reason.message}</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" variant="destructive" disabled={reportForm.formState.isSubmitting}>
                                                    {reportForm.formState.isSubmitting ? '提交中...' : '提交檢舉'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Comments section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                留言 ({comments?.length || 0})
                            </h3>
                            
                            {isCommentsLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="text-gray-500">載入留言中...</div>
                                </div>
                            ) : commentsError ? (
                                <div className="text-center py-4">
                                    <p className="text-red-500">載入留言錯誤：{commentsError.message}</p>
                                </div>
                            ) : comments && comments.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {comments.map((comment) => (
                                        <div key={comment._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-gray-900">
                                                    {comment.userId?.name || comment.name || '匿名'}
                                                </h4>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                                            <div className="text-xs text-gray-400 mt-2">
                                                IP: {comment.userIp}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">尚無留言。成為第一個留言的人！</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-2"
                                        onClick={() => setIsCommentDialogOpen(true)}
                                    >
                                        新增留言
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 