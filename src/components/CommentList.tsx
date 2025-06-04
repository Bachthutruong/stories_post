import type { Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from '@/lib/utils';
import { UserCircle } from 'lucide-react';

interface CommentListProps {
  comments: CommentType[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No comments yet. Be the first to comment!</p>;
  }

  return (
    <div className="space-y-4 py-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${(comment.guestName || comment.userId || 'U').charAt(0)}`} data-ai-hint="avatar profile" />
            <AvatarFallback>
              <UserCircle className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {comment.guestName || `User ${comment.userId?.substring(0,6)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt, 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <p className="text-sm text-foreground mt-1">{comment.content}</p>
            {comment.isFlagged && (
              <p className="text-xs text-destructive mt-1">This comment is pending review.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;