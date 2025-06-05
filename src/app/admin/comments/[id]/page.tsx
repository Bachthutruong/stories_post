"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { highlightSensitiveKeywords } from '@/lib/utils/keywordHighlighter';
import { ArrowLeft } from 'lucide-react';

interface Comment {
    _id: string;
    postId: string;
    userId?: {
        _id: string;
        name: string;
        phoneNumber: string;
        email: string;
    };
    name?: string;
    content: string;
    userIp: string;
    status: 'approved' | 'pending_review' | 'rejected';
    createdAt: string;
}

interface AdminCommentDetailPageProps {
    params: { id: string };
}

export default function AdminCommentDetailPage({ params }: AdminCommentDetailPageProps) {
    const { id: commentId } = params;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editStatus, setEditStatus] = useState<Comment['status']>('pending_review');

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);

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

    const { data: commentData, isLoading, error } = useQuery<Comment, Error, Comment, ['adminComment', string]>({ // Explicitly type the useQuery
        queryKey: ['adminComment', commentId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/comments/${commentId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch comment');
            }
            const data = await res.json();
            return data.comment;
        },
        enabled: !isAuthLoading && user?.user.role === 'admin',
        onSuccess: (data: Comment) => { // Explicitly typed data as Comment
            setEditContent(data.content);
            setEditStatus(data.status);
        },
    } as UseQueryOptions<Comment, Error, Comment, ['adminComment', string]>); // Cast the whole options object

    const updateCommentMutation = useMutation<{
        message: string;
        comment: Comment;
    }, Error, Partial<Comment>>({
        mutationFn: async (updatedComment: Partial<Comment>) => {
            const res = await fetch(`/api/admin/comments/${updatedComment._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(updatedComment),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update comment');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminComment', commentId] });
            toast({
                title: 'Success',
                description: data.message || 'Comment updated successfully',
                variant: 'default',
            });
            setEditContent(data.comment.content);
            setEditStatus(data.comment.status);
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

    const handleDeleteComment = useMutation<{
        message: string;
    }, Error, string>({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/comments/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete comment');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminComments'] });
            toast({
                title: 'Success',
                description: data.message || 'Comment deleted successfully',
                variant: 'default',
            });
            router.push('/admin/comments'); // Redirect back to comments list
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
        if (commentData) {
            updateCommentMutation.mutate({
                _id: commentData._id,
                content: editContent,
                status: editStatus,
            });
        }
    };

    const handleDeleteClick = (commentId: string) => {
        setCommentToDeleteId(commentId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (commentToDeleteId) {
            handleDeleteComment.mutate(commentToDeleteId);
            setIsDeleteDialogOpen(false);
            setCommentToDeleteId(null);
        }
    };

    if (isAuthLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading comment details...</div>;
    }

    if (!user || user?.user.role !== 'admin') {
        return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    if (!commentData) {
        return <div className="container mx-auto p-4 text-center text-gray-500">Comment not found.</div>;
    }

    const comment = commentData;

    return (
        <div className="container mx-auto p-4">
            <Button variant="outline" className="mb-6" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Comments
            </Button>
            <h1 className="text-3xl font-bold text-center mb-8">Comment Details (Admin View)</h1>

            <Card className="w-full max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>
                        Comment by:
                        <span
                            dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                                ? { __html: highlightSensitiveKeywords(`${comment.userId?.name || comment.name || 'Anonymous'} (${comment.userId?.phoneNumber || comment.userIp || ''})`, sensitiveKeywords) }
                                : undefined
                            }
                        >
                            {user?.user.role !== 'admin' || !sensitiveKeywords
                                ? `${comment.userId?.name || comment.name || 'Anonymous'} (${comment.userId?.phoneNumber || comment.userIp || ''})`
                                : null
                            }
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Comment ID: {comment._id.substring(0, 8)} - Posted on: {new Date(comment.createdAt).toLocaleDateString()}
                        <br />
                        For Post ID: <Link href={`/admin/posts/${comment.postId}`} className="text-blue-600 hover:underline">{comment.postId.substring(0, 8)}</Link>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-800 mt-2">
                        Content:
                        <span
                            dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                                ? { __html: highlightSensitiveKeywords(comment.content || '', sensitiveKeywords) }
                                : undefined
                            }
                        >
                            {user?.user.role !== 'admin' || !sensitiveKeywords
                                ? comment.content
                                : null
                            }
                        </span>
                    </p>
                    <p className="text-sm text-gray-800 mt-2">
                        Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'approved' ? 'bg-green-100 text-green-800' : comment.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {typeof comment.status === 'string' && comment.status ? (comment.status.replace(/_/g, ' ').charAt(0).toUpperCase() + comment.status.replace(/_/g, ' ').slice(1)) : 'N/A'}
                        </span>
                    </p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                        if (commentData) {
                            setEditContent(commentData.content);
                            setEditStatus(commentData.status);
                        }
                        setIsEditDialogOpen(true);
                    }} disabled={updateCommentMutation.isPending}>
                        Edit Comment
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteClick(comment._id)} disabled={handleDeleteComment.isPending}>
                        Delete Comment
                    </Button>
                </CardFooter>
            </Card>

            {/* Edit Comment Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Comment</DialogTitle>
                        <DialogDescription>
                            Make changes to the comment here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="content" className="text-right">Content</label>
                            <Textarea
                                id="content"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="status" className="text-right">Status</label>
                            <Select value={editStatus} onValueChange={(value: Comment['status']) => setEditStatus(value)}>
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
                        <Button type="submit" onClick={handleEditSubmit} disabled={updateCommentMutation.isPending}>
                            {updateCommentMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={handleDeleteComment.isPending}
                        >
                            {handleDeleteComment.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 