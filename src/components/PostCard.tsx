"use client";

import type { Post, Comment as CommentType } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { MessageCircle, MoreVertical, Flag, UserCircle, CalendarDays, Phone, Mail } from 'lucide-react';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportDialog from './ReportDialog';
import { useState } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { useAuth } from './providers/AuthProvider';

interface PostCardProps {
  post: Post;
  showInteractionsInitially?: boolean; // To control if comments/form are shown by default
  onPostUpdate?: (updatedPost: Post) => void; // For optimistic updates
}

const PostCard: React.FC<PostCardProps> = ({ post, showInteractionsInitially = false, onPostUpdate }) => {
  const { user } = useAuth();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(showInteractionsInitially);
  const [currentComments, setCurrentComments] = useState<CommentType[]>(post.comments || []);

  const handleCommentAdded = (newCommentData: { content: string; guestName?: string; isFlagged?: boolean; flaggedKeywords?: string[]}) => {
    const newComment: CommentType = {
      id: `comment-${Date.now()}`, // Mock ID
      postId: post.id,
      userId: user?.user.id,
      guestName: newCommentData.guestName,
      content: newCommentData.content,
      createdAt: new Date().toISOString(),
      isFlagged: newCommentData.isFlagged,
      flaggedKeywords: newCommentData.flaggedKeywords,
    };
    const updatedComments = [newComment, ...currentComments];
    setCurrentComments(updatedComments);
    
    if (onPostUpdate) {
      onPostUpdate({ ...post, comments: updatedComments, commentCount: updatedComments.length });
    }
  };

  const canEdit = user && (user.user.id === post.userId || user?.user.role === 'admin');

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`https://placehold.co/40x40.png?text=${post.userName.charAt(0)}`} data-ai-hint="avatar profile" />
              <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base md:text-lg">{post.userName}</CardTitle>
              <CardDescription className="text-xs">
                <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/posts/${post.id}/edit`}>Edit Post</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                <Flag className="mr-2 h-4 w-4" /> Report
              </DropdownMenuItem>
              {/* Add other actions like "View Post Details" if needed */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {post.images && post.images.length > 0 && (
        <div className="relative w-full aspect-[16/10] bg-muted">
          <Image 
            src={post.images[0].url} 
            alt={post.images[0].alt || post.description.substring(0,50)} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="story image"
          />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.description}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center"><Phone className="h-3 w-3 mr-2" /> {post.userPhone}</p>
          <p className="flex items-center"><Mail className="h-3 w-3 mr-2" /> {post.userEmail}</p>
        </div>
        {post.isFlagged && (
          <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-md">
            This post is under review due to potentially inappropriate content. Flagged keywords: {post.flaggedKeywords?.join(', ')}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 flex justify-between items-center border-t">
        <div className="flex space-x-1 md:space-x-2">
          <LikeButton postId={post.id} initialLikes={post.likeCount} isInitiallyLiked={false /* TODO: Fetch actual like status */} />
          <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground hover:text-primary" onClick={() => setShowComments(prev => !prev)}>
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </Button>
          <ShareButton postId={post.id} initialShares={post.shareCount} postUrl={`/posts/${post.id}`} postTitle={post.description.substring(0,30)} />
        </div>
        {post.isFeatured && (
          <div className="text-xs text-accent font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            Featured
          </div>
        )}
      </CardFooter>

      {showComments && (
        <div className="p-4 border-t">
          <CommentList comments={currentComments} />
          <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
        </div>
      )}

      <ReportDialog postId={post.id} isOpen={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} />
    </Card>
  );
};

export default PostCard;