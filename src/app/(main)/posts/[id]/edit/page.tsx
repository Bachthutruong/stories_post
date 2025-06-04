
"use client";

import PostForm from '@/components/PostForm';
import { findPostById } from '@/lib/mock-data'; 
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Post } from '@/lib/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null | undefined>(undefined); // undefined for loading, null if not found
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (postId) {
      const foundPost = findPostById(postId); 
      setPost(foundPost || null);
    }
  }, [postId]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Đăng nhập yêu cầu",
        description: "Vui lòng đăng nhập để chỉnh sửa bài đăng.",
        variant: "destructive"
      });
      router.push(`/auth/login?redirect=/posts/${postId}/edit`);
    } else if (!authLoading && user && post === null) { 
       toast({
        title: "Không tìm thấy bài đăng",
        description: "Bài đăng bạn đang cố gắng chỉnh sửa không tồn tại.",
        variant: "destructive"
      });
       router.push('/posts');
    } else if (!authLoading && user && post && post.userId && user.id !== post.userId && !user.isAdmin) {
        toast({ title: "Truy cập bị từ chối", description: "Bạn không có quyền chỉnh sửa bài đăng này.", variant: "destructive"});
        router.push(`/posts/${postId}`); // Redirect to post view page or home
    } else if (!authLoading && user && post && !post.userId && !user.isAdmin) { // Post by guest, non-admin cannot edit
       toast({ title: "Truy cập bị từ chối", description: "Bạn không có quyền chỉnh sửa bài đăng của khách này.", variant: "destructive"});
       router.push(`/posts/${postId}`);
    }
  }, [authLoading, user, post, router, postId, toast]);


  if (authLoading || post === undefined) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Skeleton className="h-12 w-1/2 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!user) {
     // This state should be brief due to the useEffect redirect
     return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl mb-4">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }
  
  if (!post) {
    // This state should be brief due to the useEffect redirect
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl">Không tìm thấy bài đăng. Đang chuyển hướng...</p>
      </div>
    );
  }

  // Final authorization check, should be redundant if useEffect works correctly
  // but serves as a fallback. User ID logic for mock data:
  // If post.userId is set, it must match user.id OR user must be admin.
  // If post.userId is NOT set (guest post), only admin can edit.
  const canEdit = user.isAdmin || (post.userId && user.id === post.userId);

  if (!canEdit) {
     return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl text-destructive">Bạn không có quyền chỉnh sửa bài đăng này.</p>
        <Button asChild><Link href={`/posts/${postId}`}>Quay lại bài đăng</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PostForm post={post} onSubmitSuccess={() => router.push(`/posts/${postId}`)} />
    </div>
  );
}
