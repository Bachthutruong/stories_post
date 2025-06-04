
"use client";

import PostForm from '@/components/PostForm';
import { findPostById, mockUsers } from '@/lib/mock-data'; // Assuming findPostById is available
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Post } from '@/lib/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null | undefined>(undefined); // undefined for loading, null if not found
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (postId) {
      const foundPost = findPostById(postId); // Mock data fetching
      setPost(foundPost || null);
    }
  }, [postId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/posts/' + postId + '/edit');
    }
    if (!authLoading && user && post === null) { // Post not found
       router.push('/posts'); // Or a 404 page
    }
    if (!authLoading && user && post && post.userId && user.id !== post.userId && !user.isAdmin) {
        // User does not own this post and is not admin
        toast({ title: "Access Denied", description: "You are not authorized to edit this post.", variant: "destructive"});
        router.push(`/posts`);
    }
  }, [authLoading, user, post, router, postId]);


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
     return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl mb-4">Please log in to edit posts.</p>
        <Button asChild><Link href={`/auth/login?redirect=/posts/${postId}/edit`}>Login</Link></Button>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl">Post not found.</p>
         <Button asChild><Link href="/posts">Back to Posts</Link></Button>
      </div>
    );
  }

  // Additional check for non-admin user trying to edit others' posts
  // This userId check is basic; real apps use backend validation.
  const mockPostOwnerId = mockUsers.find(u => u.name === post.userName && u.phone === post.userPhone)?.id;
  if (!user.isAdmin && user.id !== mockPostOwnerId) {
     return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl text-destructive">You are not authorized to edit this post.</p>
        <Button asChild><Link href="/posts">Back to Posts</Link></Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <PostForm post