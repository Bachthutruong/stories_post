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

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterBy, setFilterBy] = useState(searchParams.get('filterBy') || 'none');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsHidden, setEditIsHidden] = useState(false);

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
      setIsEditDialogOpen(false);
      setSelectedPost(null);
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
    setSelectedPost(post);
    setEditDescription(post.description);
    setEditIsFeatured(post.isFeatured);
    setEditIsHidden(post.isHidden);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (selectedPost) {
      updatePostMutation.mutate({
        _id: selectedPost._id,
        description: editDescription,
        isFeatured: editIsFeatured,
        isHidden: editIsHidden,
      });
    }
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
              <CardTitle>{post.description.substring(0, 50)}...</CardTitle>
              <CardDescription>
                By {post.userId?.name || 'Anonymous'} ({post.userId?.phoneNumber})
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
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="icon" onClick={() => handleEditClick(post)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(post._id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Link href={`/posts/${post._id}`} target="_blank">
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
              <label htmlFor="editDescription" className="text-right">Description</label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFeatured"
                checked={editIsFeatured}
                onCheckedChange={(checked) => setEditIsFeatured(!!checked)}
              />
              <label htmlFor="isFeatured" className="text-sm font-medium leading-none">Feature Post</label>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isHidden"
                checked={editIsHidden}
                onCheckedChange={(checked) => setEditIsHidden(!!checked)}
              />
              <label htmlFor="isHidden" className="text-sm font-medium leading-none">Hide Post</label>
              {editIsHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditSubmit} disabled={updatePostMutation.isPending}>
              {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
