"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import useDebounce from '@/hooks/useDebounce';
import { highlightSensitiveKeywords } from '@/lib/utils/keywordHighlighter';
import { truncateText } from '@/lib/utils/textUtils';

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
    _id: string; // Add _id for user
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

export default function AdminManagePostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

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
    enabled: !isAuthLoading && user?.user.role === 'admin', // Only fetch if admin
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterBy, setFilterBy] = useState(searchParams.get('filterBy') || 'none');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDeleteId, setPostToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user?.user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
        router.replace('/admin/login?redirect=/admin/posts');
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
      router.push(`/admin/posts?${queryString}`, { scroll: false });
    }
  }, [debouncedSearchQuery, filterBy, sortOrder, page, user, isAuthLoading]);

  const { data, isLoading, error } = useQuery<AllPostsData, Error>({
    queryKey: ['adminPosts', debouncedSearchQuery, filterBy, sortOrder, page],
    queryFn: async () => {
      const queryString = buildQueryString();
      const res = await fetch(`/api/admin/posts?${queryString}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch posts');
      }
      return res.json();
    },
    enabled: !isAuthLoading && user?.user.role === 'admin',
  });

  const updatePostMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
      toast({
        title: 'Success',
        description: data.message || 'Post updated successfully',
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

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/admin/posts/${postId}`, {
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
      router.push('/admin/posts');
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
    }
  };

  const handleEditClick = (post: Post) => {
    router.push(`/admin/posts/${post._id}`);
  };

  const handleEditSubmit = () => {
    // No longer needed here as editing happens on detail page
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDeleteId(postId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (postToDeleteId) {
      deletePostMutation.mutate(postToDeleteId);
      setIsDeleteDialogOpen(false);
      setPostToDeleteId(null);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
  }

  if (!user || user?.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading posts...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Manage Posts</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by user name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:flex-1"
        />
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="createdAt">Time Posted</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
            <SelectItem value="shares">Shares</SelectItem>
            <SelectItem value="commentsCount">Comments</SelectItem>
            <SelectItem value="isFeatured">Featured</SelectItem>
            <SelectItem value="isHidden">Hidden</SelectItem>
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
        {data?.posts.map((post) => (
          <Card key={post._id} className="w-full max-w-sm mx-auto shadow-lg">
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
              <p className="text-sm text-gray-600 mb-2">Likes: {post.likes}, Shares: {post.shares}, Comments: {post.commentsCount}</p>
              <p className="text-sm text-gray-600 mb-2">Featured: {post.isFeatured ? 'Yes' : 'No'}, Hidden: {post.isHidden ? 'Yes' : 'No'}</p>
              <p className="text-sm text-gray-800 mt-2">
                <span
                  dangerouslySetInnerHTML={user?.user.role === 'admin' && sensitiveKeywords
                    ? { __html: highlightSensitiveKeywords(truncateText(post.description || '', 150), sensitiveKeywords) }
                    : undefined
                  }
                >
                  {user?.user.role !== 'admin' || !sensitiveKeywords
                    ? truncateText(post.description, 150)
                    : null
                  }
                </span>
              </p>
              <p className="text-sm text-gray-800 mt-2">
                Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.status === 'approved' ? 'bg-green-100 text-green-800' : post.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {typeof post.status === 'string' && post.status ? (post.status.replace(/_/g, ' ').charAt(0).toUpperCase() + post.status.replace(/_/g, ' ').slice(1)) : 'N/A'}
                </span>
              </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="icon" onClick={() => handleEditClick(post)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(post._id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Link href={`/admin/posts/${post._id}`}>
                <Button variant="outline" size="icon"><Eye className="w-4 h-4" /></Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
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

      {/* Edit Post Dialog */}
      {/* This dialog is no longer needed as editing is moved to the detail page */}
      {/* Delete Post Dialog */}
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
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
