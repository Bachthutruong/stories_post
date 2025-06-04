
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from './providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { moderatePostContent } from '@/ai/flows/moderate-post-content'; // Assuming this can be used for comments too
import { mockModerationKeywords } from '@/lib/mock-data'; // Using mock keywords for now

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment too long"),
  guestName: z.string().optional(), // Optional if user is logged in
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: string;
  onCommentAdded: (comment: { content: string; guestName?: string; isFlagged?: boolean; flaggedKeywords?: string[] }) => void; // Simplified, real type would be Comment
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
      guestName: user?.name || '',
    },
  });

  const onSubmit: SubmitHandler<CommentFormData> = async (data) => {
    setIsSubmitting(true);
    if (!user && !data.guestName?.trim()) {
      form.setError("guestName", { type: "manual", message: "Name is required for guests." });
      setIsSubmitting(false);
      return;
    }
    
    let isFlagged = false;
    let flaggedKeywords: string[] = [];

    try {
      // Content moderation
      const moderationResult = await moderatePostContent({
        postDescription: data.content, // Using postDescription field for comment content
        keywords: mockModerationKeywords.map(k => k.keyword),
      });

      if (!moderationResult.isSafe) {
        isFlagged = true;
        flaggedKeywords = moderationResult.flaggedKeywords;
        toast({
          title: "Comment Moderation",
          description: `Your comment contains potentially inappropriate content (${flaggedKeywords.join(', ')}) and will be reviewed.`,
          variant: "default",
          duration: 5000,
        });
      }
      
      // Simulate API call
      console.log('Submitting comment:', { postId, userId: user?.id, ...data, isFlagged, flaggedKeywords });
      
      // Call parent callback to update UI optimistically
      onCommentAdded({ content: data.content, guestName: user ? undefined : data.guestName, isFlagged, flaggedKeywords });
      form.reset({ content: '', guestName: user?.name || '' }); // Reset form
      if (!isFlagged) {
        toast({ title: "Comment Added", description: "Your comment has been posted." });
      }

    } catch (error) {
      console.error("Error submitting comment or moderating content:", error);
      toast({ title: "Error", description: "Could not post comment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 border-t mt-4">
        <h3 className="text-lg font-semibold font-headline">Leave a Comment</h3>
        {!user && (
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name (Guest)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Comment</FormLabel>
              <FormControl>
                <Textarea placeholder="Write your comment..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
    </Form>
  );
};

export default CommentForm;
