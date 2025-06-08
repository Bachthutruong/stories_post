"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import useDebounce from '@/hooks/useDebounce';
import { highlightSensitiveKeywords } from '@/lib/utils/keywordHighlighter';
import { truncateText } from '@/lib/utils/textUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface AllCommentsData {
    comments: Comment[];
    currentPage: number;
    totalPages: number;
    totalComments: number;
}

export default function AdminManageCommentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, isLoading: isAuthLoading } = useAuth();

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

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [filterBy, setFilterBy] = useState(searchParams.get('filterBy') || 'none');
    const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading) {
            if (!user || user?.user.role !== 'admin') {
                toast({
                    title: 'Access Denied',
                    description: 'You do not have administrative privileges.',
                    variant: 'destructive',
                });
                router.replace('/admin/login?redirect=/admin/comments');
            }
        }
    }, [user, isAuthLoading, router, toast]);

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
        if (filterBy && filterBy !== 'none') params.set('filterBy', filterBy);
        if (sortOrder) params.set('sortOrder', sortOrder);
        params.set('page', page.toString());
        return params.toString();
    };

    useEffect(() => {
        if (!isAuthLoading && user?.user.role === 'admin') {
            const queryString = buildQueryString();
            router.push(`/admin/comments?${queryString}`, { scroll: false });
        }
    }, [debouncedSearchQuery, filterBy, sortOrder, page, user, isAuthLoading]);

    const { data, isLoading, error } = useQuery<AllCommentsData, Error>({
        queryKey: ['adminComments', debouncedSearchQuery, filterBy, sortOrder, page],
        queryFn: async () => {
            const queryString = buildQueryString();
            const res = await fetch(`/api/admin/comments?${queryString}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch comments');
            }
            return res.json();
        },
        enabled: !isAuthLoading && user?.user.role === 'admin',
    });

    const updateCommentMutation = useMutation({
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
            queryClient.invalidateQueries({ queryKey: ['adminComments'] });
            toast({
                title: 'Success',
                description: data.message || 'Comment updated successfully',
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

    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const res = await fetch(`/api/admin/comments/${commentId}`, {
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
            router.push('/admin/comments');
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        },
    });

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (data?.totalPages || 1)) {
            setPage(newPage);
            console.log("Changing page to:", newPage);
        }
    };

    const handleEditClick = (comment: Comment) => {
        router.push(`/admin/comments/${comment._id}`);
    };

    const handleEditSubmit = () => {
        // No longer needed here as editing happens on detail page
    };

    const handleDeleteClick = (commentId: string) => {
        setCommentToDeleteId(commentId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (commentToDeleteId) {
            deleteCommentMutation.mutate(commentToDeleteId);
            setIsDeleteDialogOpen(false);
            setCommentToDeleteId(null);
        }
    };

    if (isAuthLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
    }

    if (!user || user?.user.role !== 'admin') {
        return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
    }

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Loading comments...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 md:px-8 py-4">
            <h1 className="text-3xl font-bold text-center mb-8">Manage Comments</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                    placeholder="Search by user name or comment content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:flex-1"
                />
                <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="createdAt">Time Posted</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="max-w-[300px] md:max-w-full overflow-x-auto mb-8">
                <Table className="min-w-[920px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-0 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] text-nowrap">Comment ID</TableHead>
                            <TableHead className="px-0 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] text-nowrap">Post ID</TableHead>
                            <TableHead className="px-0 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px] text-nowrap">User/Name</TableHead>
                            <TableHead className="px-0 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px] text-nowrap">Content</TableHead>
                            <TableHead className="px-0 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px] text-nowrap">Status</TableHead>
                            <TableHead className="px-0 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px] text-nowrap">Posted At</TableHead>
                            <TableHead className="relative px-0 py-3 sm:px-6 w-[80px] text-nowrap"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.comments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-sm text-gray-500">No comments found.</TableCell>
                            </TableRow>
                        ) : (
                            data?.comments.map((comment) => (
                                <TableRow key={comment._id}>
                                    <TableCell className="px-0 py-4 sm:px-6 text-sm font-medium text-gray-900 break-words">
                                        <Link href={`/posts/${comment.postId}`} className="text-blue-600 hover:underline">
                                            {comment._id.substring(0, 8)}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="px-0 py-4 sm:px-6 text-sm text-gray-500 break-words">{comment.postId.substring(0, 8)}</TableCell>
                                    <TableCell className="px-0 py-4 sm:px-6 text-sm text-gray-900 break-words">
                                        <div className="text-sm text-gray-900">{comment.userId?.name || comment.name || 'Anonymous'}</div>
                                        <div className="text-xs text-gray-500">{comment.userId?.phoneNumber || comment.userIp}</div>
                                    </TableCell>
                                    <TableCell className="px-0 py-4 sm:px-6 break-words">
                                        <span
                                            dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                                                ? { __html: highlightSensitiveKeywords(truncateText(comment.content || '', 150), sensitiveKeywords) }
                                                : undefined
                                            }
                                        >
                                            {user?.user.role !== 'admin' || !sensitiveKeywords
                                                ? truncateText(comment.content, 150)
                                                : null
                                            }
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-0 py-4 sm:px-6 break-words">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'approved' ? 'bg-green-100 text-green-800' : comment.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {typeof comment.status === 'string' && comment.status ? (comment.status.replace(/_/g, ' ').charAt(0).toUpperCase() + comment.status.replace(/_/g, ' ').slice(1)) : 'N/A'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-0 py-4 sm:px-6 text-sm text-gray-500 break-words">{new Date(comment.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="px-0 py-4 sm:px-6 flex text-right text-sm font-medium space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEditClick(comment)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(comment._id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.totalPages >= 1 && (
                <div className="flex justify-center items-center space-x-2 mb-8">
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-700">Page {page} of {data.totalPages}</span>
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === data.totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Edit Comment Dialog */}
            {/* This dialog is no longer needed as editing is moved to the detail page */}

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
                        <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 