"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { Switch } from '@/components/ui/switch';

interface Keyword {
  _id: string;
  word: string;
  isSafe: boolean;
  createdAt: string;
}

const keywordFormSchema = z.object({
  word: z.string().min(2, { message: 'Keyword must be at least 2 characters.' }),
  isSafe: z.boolean().default(false),
});

type KeywordFormValues = z.infer<typeof keywordFormSchema>;

export default function AdminManageKeywordsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);

  const keywordForm = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordFormSchema),
    defaultValues: { word: '', isSafe: false },
  });

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user?.user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
        router.replace('/admin/login?redirect=/admin/keywords');
      }
    }
  }, [user, isAuthLoading, router, toast]);

  const { data: keywords, isLoading, error } = useQuery<Keyword[], Error>({
    queryKey: ['adminKeywords'],
    queryFn: async () => {
      const res = await fetch('/api/admin/keywords', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch keywords');
      }
      return res.json().then(data => data.keywords);
    },
    enabled: !isAuthLoading && user?.user?.role === 'admin',
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (newKeyword: KeywordFormValues) => {
      const res = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newKeyword),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add keyword');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminKeywords'] });
      toast({
        title: 'Success',
        description: data.message || 'Keyword added successfully',
        variant: 'default',
      });
      setIsAddEditDialogOpen(false);
      keywordForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const updateKeywordMutation = useMutation({
    mutationFn: async (updatedKeyword: Keyword) => {
      const res = await fetch(`/api/admin/keywords/${updatedKeyword._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ word: updatedKeyword.word, isSafe: updatedKeyword.isSafe }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update keyword');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminKeywords'] });
      toast({
        title: 'Success',
        description: data.message || 'Keyword updated successfully',
        variant: 'default',
      });
      setIsAddEditDialogOpen(false);
      setSelectedKeyword(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      const res = await fetch(`/api/admin/keywords/${keywordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete keyword');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminKeywords'] });
      toast({
        title: 'Success',
        description: data.message || 'Keyword deleted successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleAddClick = () => {
    setSelectedKeyword(null);
    keywordForm.reset();
    setIsAddEditDialogOpen(true);
  };

  const handleEditClick = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
    keywordForm.setValue('word', keyword.word);
    keywordForm.setValue('isSafe', keyword.isSafe);
    setIsAddEditDialogOpen(true);
  };

  const onSubmit = (values: KeywordFormValues) => {
    if (selectedKeyword) {
      updateKeywordMutation.mutate({ ...selectedKeyword, word: values.word, isSafe: values.isSafe });
    } else {
      addKeywordMutation.mutate(values);
    }
  };

  const handleDeleteKeyword = (keywordId: string) => {
    if (window.confirm('Are you sure you want to delete this keyword?')) {
      deleteKeywordMutation.mutate(keywordId);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
  }

  if (!user || user?.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading keywords...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Manage Keywords</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Keyword
        </Button>
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Is Safe</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No keywords found.
                </TableCell>
              </TableRow>
            ) : (
              keywords?.map((keyword) => (
                <TableRow key={keyword._id}>
                  <TableCell className="font-medium">{keyword.word}</TableCell>
                  <TableCell>{keyword.isSafe ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(keyword.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(keyword)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteKeyword(keyword._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Keyword Dialog */}
      <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedKeyword ? 'Edit Keyword' : 'Add New Keyword'}</DialogTitle>
            <DialogDescription>
              {selectedKeyword ? 'Edit the keyword here.' : 'Add a new keyword here.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={keywordForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="word" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Keyword
              </label>
              <Input
                id="word"
                placeholder="Enter keyword"
                {...keywordForm.register('word')}
              />
              {keywordForm.formState.errors.word && (
                <p className="text-sm text-red-500">{keywordForm.formState.errors.word.message}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-safe"
                checked={keywordForm.watch('isSafe')}
                onCheckedChange={(checked) => keywordForm.setValue('isSafe', checked)}
              />
              <label htmlFor="is-safe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Mark as Safe Keyword
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addKeywordMutation.isPending || updateKeywordMutation.isPending}>
                {selectedKeyword ? 'Save Changes' : 'Add Keyword'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
