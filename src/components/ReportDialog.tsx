"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './providers/AuthProvider';
import { Input } from './ui/input';

const reportSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason too long"),
  guestName: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportDialogProps {
  postId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ postId, isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: '' },
  });

  const onSubmit: SubmitHandler<ReportFormData> = async (data) => {
    setIsSubmitting(true);
    if (!user && !data.guestName?.trim()) {
      form.setError("guestName", { type: "manual", message: "Name is required to report as guest." });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    console.log('Submitting report:', { postId, reportedBy: user ? user.user.id : data.guestName, reason: data.reason });
    // TODO: Implement actual report submission logic
    
    setTimeout(() => { // Simulate network delay
      toast({ title: "Report Submitted", description: "Thank you for your feedback. We will review this post." });
      setIsSubmitting(false);
      onOpenChange(false);
      form.reset();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!user && (
              <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name (Optional)</FormLabel>
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for reporting</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Please provide details about why you are reporting this post." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;