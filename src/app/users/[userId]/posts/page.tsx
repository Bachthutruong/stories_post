"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';

interface Post {
  _id: string;
  postId: string;
  description: string;
  images: { url: string; public_id: string }[];
  likes: number;
  shares: number;
  commentsCount: number;
  createdAt: string;
}

export default function UserPostsPage() {
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userPosts, isLoading, error } = useQuery<Post[], Error>({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is missing');
      const res = await fetch(`/api/users/${userId}/posts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch user posts');
      }
      return res.json();
    },
    enabled: !!userId, // Only fetch if userId is available
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/users/${userId}/posts/${postId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
      toast({
        title: 'Success',
        description: data.message || 'Bài viết đã được xóa.',
        variant: 'default',
      });
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
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      deletePostMutation.mutate(postId);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Đang tải bài viết...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Lỗi: {error.message}</div>;
  }

  if (!userPosts || userPosts.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Bài viết của tôi</h1>
        <p>Bạn chưa có bài viết nào.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8 text-center">Bài viết của tôi</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userPosts.map((post) => (
          <Card key={post._id}>
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
              <p className="text-sm text-gray-600 line-clamp-3">{post.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {post.likes} Likes • {post.commentsCount} Comments
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
    </div>
  );
}
 