
"use client";

import { useState } from 'react';
import { mockModerationKeywords } from '@/lib/mock-data';
import type { ModerationKeyword } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const keywordSchema = z.object({
  keyword: z.string().min(3, "Keyword must be at least 3 characters").max(50, "Keyword too long"),
});
type KeywordFormData = z.infer<typeof keywordSchema>;

export default function AdminKeywordsPage() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<ModerationKeyword[]>(mockModerationKeywords);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<KeywordFormData>({
    resolver: zodResolver(keywordSchema),
    defaultValues: { keyword: '' },
  });

  const handleAddKeyword: SubmitHandler<KeywordFormData> = (data) => {
    setIsSubmitting(true);
    if (keywords.some(kw => kw.keyword.toLowerCase() === data.keyword.toLowerCase())) {
      form.setError("keyword", { type: "manual", message: "Keyword already exists." });
      setIsSubmitting(false);
      return;
    }
    const newKeyword: ModerationKeyword = {
      id: `kw${Date.now()}`, // Mock ID
      keyword: data.keyword.toLowerCase(),
    };
    setKeywords(prev => [newKeyword, ...prev]);
    toast({ title: "Keyword Added", description: `Keyword "${data.keyword}" has been added.` });
    form.reset();
    setIsSubmitting(false);
  };

  const handleDeleteKeyword = (keywordId: string) => {
    const keywordToDelete = keywords.find(kw => kw.id === keywordId);
    setKeywords(prev => prev.filter(kw => kw.id !== keywordId));
    toast({ title: "Keyword Deleted", description: `Keyword "${keywordToDelete?.keyword}" has been deleted.`, variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline text-primary">Manage Moderation Keywords</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Keyword</CardTitle>
          <CardDescription>Keywords will be used by the AI to flag potentially inappropriate content in posts and comments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddKeyword)} className="flex items-start space-x-2">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">New Keyword</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a keyword (e.g., spam, offensive)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" /> {isSubmitting ? 'Adding...' : 'Add Keyword'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Keywords ({keywords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {keywords.length > 0 ? (
            <ul className="space-y-2">
              {keywords.map(kw => (
                <li key={kw.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">{kw.keyword}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteKeyword(kw.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No keywords defined yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
