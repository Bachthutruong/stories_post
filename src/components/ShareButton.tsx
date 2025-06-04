"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ShareButtonProps {
  postId: string;
  initialShares: number;
  postUrl: string; // e.g., /posts/[id]
  postTitle: string;
}

export function ShareButton({ postId, initialShares, postUrl, postTitle }: ShareButtonProps) {
  const [shares, setShares] = useState(initialShares);
  const { toast } = useToast();

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullPostUrl = `${siteUrl}${postUrl}`;

  const handleShare = (platform: 'facebook' | 'twitter' | 'copy') => {
    // Mock incrementing share count
    setShares(prev => prev + 1);
    // TODO: Add actual server call to update share count for postId
    console.log(`Shared post ${postId} on ${platform}. New share count: ${shares + 1}`);
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullPostUrl)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullPostUrl)}&text=${encodeURIComponent(postTitle)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'copy':
        navigator.clipboard.writeText(fullPostUrl).then(() => {
          toast({ title: "Link Copied!", description: "Post link copied to clipboard." });
        }).catch(err => {
          toast({ title: "Error", description: "Could not copy link.", variant: "destructive" });
          console.error('Failed to copy: ', err);
        });
        return; // Don't open a new window for copy
    }
    toast({ title: "Shared!", description: `Post shared on ${platform}.` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
          <Share2 className="h-4 w-4" />
          <span>{shares}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('facebook')}>Share on Facebook</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>Share on Twitter</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>Copy Link</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}