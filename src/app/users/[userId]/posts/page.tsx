"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  _id: string;
  postId: string;
  description: string;
  images: { url: string; public_id: string }[];
  likes: number;
  shares: number;
  title: string;
  commentsCount: number;
  createdAt: string;
}

export default function UserPostsPage() {
  const { userId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const userData = JSON.parse(localStorage.getItem('hem-story-user') || '{}');
  const token = userData.token;
  const { data: userPosts, isLoading, error } = useQuery<Post[], Error>({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is missing');
      const res = await fetch(`/api/users/${userId}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 403) {
          router.push('/auth/login');
          throw new Error('Bạn cần đăng nhập để xem bài viết của mình');
        }
        throw new Error(errorData.message || 'Failed to fetch user posts');
      }
      return res.json();
    },
    enabled: !!userId,
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/users/${userId}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
      toast({
        title: 'Thành công',
        description: data.message || 'Bài viết đã được xóa.',
        variant: 'default',
      });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Đã xảy ra lỗi khi xóa bài viết.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!userPosts || userPosts.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Bài viết của tôi</h1>
        <p className="mb-6">Bạn chưa có bài viết nào.</p>
        <Link href="/create-post">
          <Button className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Tạo bài viết mới
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Bài viết của tôi</h1>
        <Link href="/create-post">
          <Button className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Tạo bài viết mới
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userPosts.map((post) => (
          <Card key={post._id} className="hover:shadow-lg transition-shadow">
            {post.images && post.images.length > 0 && (
              <div className="relative w-full h-48">
                <Image
                  src={post.images[0].url}
                  alt={post.description.substring(0, 50) || 'Post image'}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-md"
                />
              </div>
            )}
            <CardHeader>
              <CardDescription>{new Date(post.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <h2 className="text-lg font-bold">{post.title}</h2>
              <p className="text-sm text-gray-600 line-clamp-3">{post.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {post.likes} Likes • {post.commentsCount} Comments • {post.shares} Shares
              </div>
              <div className="flex gap-2">
                <Link href={`/users/${userId}/posts/${post._id}/edit`} passHref>
                  <Button variant="outline" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteClick(post._id)}
                  disabled={deletePostMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
