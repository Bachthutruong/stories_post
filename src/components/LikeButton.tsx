"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from '@/lib/utils';
import { useAuth } from './providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
// import { likePostOnServer, unlikePostOnServer } from '@/actions/postActions'; // Placeholder for server action

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  isInitiallyLiked: boolean;
}

export function LikeButton({ postId, initialLikes, isInitiallyLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Effect to sync with potential external changes to isInitiallyLiked
  useEffect(() => {
    setIsLiked(isInitiallyLiked);
    setLikes(initialLikes);
  }, [isInitiallyLiked, initialLikes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent parent link navigation
    e.stopPropagation(); // Stop event bubbling
    
    if (isLoading) return;
    
    setIsLoading(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : likes - 1;
    setIsLiked(newIsLiked);
    setLikes(newLikes);

    try {
      const body = user 
        ? { userId: user.user.id }
        : { name: 'Anonymous', userIp: '127.0.0.1' }; // Guest user fallback

      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to update like status');
      }

      const result = await res.json();
      setLikes(result.likes);
      
      toast({
        title: result.message,
        description: newIsLiked ? 'You liked this post!' : 'You unliked this post.',
      });
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikes(likes);
      
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive"
      });
      console.error('Like error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors",
        isLiked && "text-primary",
        isAnimating && "animate-subtle-pulse"
      )}
    >
      <Heart className={cn("h-4 w-4", isLiked && "fill-current text-primary")} />
      <span>{likes}</span>
    </Button>
  );
}
