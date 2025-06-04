
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Effect to sync with potential external changes to isInitiallyLiked
  useEffect(() => {
    setIsLiked(isInitiallyLiked);
    setLikes(initialLikes);
  }, [isInitiallyLiked, initialLikes]);

  const handleLike = async () => {
    if (!user) {
      // Prompt for guest like: In a real app, this would open a dialog to enter name.
      // For now, we'll just simulate it or disallow.
      // For simplicity, let's say guests can't like directly via this button yet, or they need to login.
      toast({ title: "Login Required", description: "Please login to like posts." });
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500); // Duration of animation

    // Optimistic update
    if (isLiked) {
      setLikes(prev => prev - 1);
      setIsLiked(false);
      // await unlikePostOnServer(postId, user.id); // Placeholder
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
      // await likePostOnServer(postId, user.id); // Placeholder
    }
    // TODO: Add actual server call and error handling
    console.log(`User ${user.id} ${isLiked ? 'unliked' : 'liked'} post ${postId}. New like status: ${!isLiked}`);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
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
