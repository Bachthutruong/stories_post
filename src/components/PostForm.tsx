"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUploadPlaceholder from './ImageUploadPlaceholder';
import type { Post } from '@/lib/types';
import { useState, useEffect } from 'react';
import TermsDialog from './TermsDialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/AuthProvider';
import { generatePostId } from '@/lib/utils'; // For mock ID
import { moderatePostContent } from '@/ai/flows/moderate-post-content';
import { mockModerationKeywords } from '@/lib/mock-data'; // Using mock keywords

const postSchema = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters").max(50),
  userPhone: z.string().regex(/^\d{10,11}$/, "Invalid phone number format (10-11 digits)"),
  userEmail: z.string().email("Invalid email address"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  // images are handled separately
});

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  post?: Post; // For editing
  onSubmitSuccess?: (postId: string) => void; // Callback after successful submission
}

const PostForm: React.FC<PostFormProps> = ({ post, onSubmitSuccess }) => {
  const { user, login } = useAuth(); // For auto-filling fields or creating account
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [formDataForSubmission, setFormDataForSubmission] = useState<PostFormData | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: post ? {
      userName: post.userName,
      userPhone: post.userPhone,
      userEmail: post.userEmail,
      description: post.description,
    } : {
      userName: user?.name || '',
      userPhone: user?.phone || '',
      userEmail: '', // Email might not be in mock user
      description: '',
    },
  });
  
  useEffect(() => {
    if (user && !post) { // If user is logged in and it's a new post form
      form.reset({
        userName: user.name,
        userPhone: user.phone,
        userEmail: form.getValues('userEmail') || '', // keep email if already typed
        description: form.getValues('description'),
      });
    }
  }, [user, form, post]);

  const handleImageFilesChange = (files: File[]) => {
    setImageFiles(files);
  };

  const processSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    // TODO: Actual image upload to Cloudinary will happen here
    // For now, we'll just use placeholder URLs or skip this part for mock.
    const imageUrls = imageFiles.map((file, index) => ({ url: `https://placehold.co/600x400.png?text=Uploaded+${index+1}`, alt: file.name }));
    
    if (imageUrls.length === 0 && (!post || post.images.length === 0)) {
        toast({ title: "Image Required", description: "Please upload at least one image.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    // AI Content Moderation
    let isFlagged = false;
    let flaggedKeywords: string[] = [];
    try {
      const moderationResult = await moderatePostContent({
        postDescription: data.description,
        keywords: mockModerationKeywords.map(k => k.keyword),
      });
      if (!moderationResult.isSafe) {
        isFlagged = true;
        flaggedKeywords = moderationResult.flaggedKeywords;
        toast({
          title: "Post Moderation",
          description: `Your post description contains potentially inappropriate content (${flaggedKeywords.join(', ')}) and will be reviewed.`,
          variant: "default",
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Error during content moderation:", error);
      // Decide if submission should proceed or be blocked
      // For now, let's allow submission but flag it
    }

    const postId = post?.id || generatePostId();
    const submissionData: Partial<Post> = {
      id: postId,
      ...data,
      images: imageUrls.length > 0 ? imageUrls : post?.images || [], // Use new images or existing if not changed
      createdAt: post?.createdAt || new Date().toISOString(),
      // Mock counts, user ID
      userId: user?.id, 
      likeCount: post?.likeCount || 0,
      shareCount: post?.shareCount || 0,
      commentCount: post?.commentCount || 0,
      likes: post?.likes || [],
      comments: post?.comments || [],
      isFlagged,
      flaggedKeywords,
    };

    console.log('Submitting Post:', submissionData);

    // Simulate account creation for new users
    if (!user && !post) {
      // In a real app, this would be a backend call
      const loginSuccess = await login(data.userName, data.userPhone); // Mock login also acts as mock account creation
      if (loginSuccess) {
        toast({ title: "Account Created & Logged In", description: "Your account has been created, and you're now logged in." });
      } else {
         toast({ title: "Account Creation Mocked", description: "Proceeding with post submission." });
      }
    }
    
    // TODO: Replace with actual API call
    setTimeout(() => {
      toast({ title: post ? "Post Updated" : "Post Created", description: `Your post "${data.description.substring(0,20)}..." has been successfully ${post ? 'updated' : 'submitted'}${isFlagged ? ' and is pending review' : ''}.` });
      setIsSubmitting(false);
      if (onSubmitSuccess) {
        onSubmitSuccess(postId);
      } else {
        router.push(isFlagged ? `/admin/posts?highlight=${postId}` : `/posts`); // Redirect to all posts or the new post's page
      }
    }, 1500);
  };

  const onFormSubmit: SubmitHandler<PostFormData> = (data) => {
    if (post) { // Editing existing post, no terms dialog
      processSubmit(data);
    } else { // Creating new post
      setFormDataForSubmission(data);
      setIsTermsDialogOpen(true);
    }
  };

  const handleAgreeToTerms = () => {
    if (formDataForSubmission) {
      processSubmit(formDataForSubmission);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8 max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-headline text-center mb-6">{post ? 'Edit Your Story' : 'Share Your Story'}</h1>
          
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl><Input placeholder="e.g. Nguyễn Văn A" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input type="tel" placeholder="e.g. 0901234567" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="e.g. example@mail.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormItem>
            <FormLabel>Upload Image(s)</FormLabel>
            <ImageUploadPlaceholder 
              onFilesChange={handleImageFilesChange} 
              maxFiles={5}
              existingImages={post?.images}
            />
            {imageFiles.length === 0 && !post?.images?.length && form.formState.isSubmitted && <p className="text-sm font-medium text-destructive">Please upload at least one image.</p>}
          </FormItem>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Tell us about your story, moment, or event..." {...field} rows={5} /></FormControl>
                <FormDescription>Share the details that make your story special.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (post ? 'Updating...' : 'Submitting...') : (post ? 'Update Post' : 'Submit Post')}
          </Button>
        </form>
      </Form>
      {!post && ( // Only show terms dialog for new posts
        <TermsDialog 
          isOpen={isTermsDialogOpen} 
          onOpenChange={setIsTermsDialogOpen}
          onAgree={handleAgreeToTerms}
        />
      )}
    </>
  );
};

export default PostForm;