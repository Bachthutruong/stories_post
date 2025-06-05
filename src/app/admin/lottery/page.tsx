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
import { PlusCircle, Award, History, X } from 'lucide-react';
import { useFieldArray, useForm, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

interface Lottery {
  _id: string;
  drawDate: string;
  winningNumbers: string[];
  winners: {
    userId: { _id: string; name: string; phoneNumber: string; email: string };
    postId: { _id: string; postId: string; description: string; images: { url: string; public_id: string }[] };
  }[];
  isActive: boolean;
  createdAt: string;
}

const createLotteryFormSchema = z.object({
  drawDate: z.string().min(1, { message: 'Draw date is required.' }),
  winningNumbers: z.array(z.string().regex(/^\d{3}$/, { message: 'Winning number must be 3 digits.' })).min(1, 'At least one winning number is required.'),
});

type CreateLotteryFormValues = z.infer<typeof createLotteryFormSchema>;

export default function AdminManageLotteryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isCreateLotteryDialogOpen, setIsCreateLotteryDialogOpen] = useState(false);
  const [isDrawResultDialogOpen, setIsDrawResultDialogOpen] = useState(false);
  const [drawnWinners, setDrawnWinners] = useState<Lottery['winners']>([]);
  const [isConfirmDrawDialogOpen, setIsConfirmDrawDialogOpen] = useState(false);
  const [lotteryToDrawId, setLotteryToDrawId] = useState<string | null>(null);

  const createLotteryForm = useForm<CreateLotteryFormValues>({
    resolver: zodResolver(createLotteryFormSchema),
    defaultValues: { winningNumbers: [], drawDate: '' },
  });

  // @ts-ignore
  const { fields, append, remove } = useFieldArray<CreateLotteryFormValues, 'winningNumbers', 'id'>({
    control: createLotteryForm.control as Control<CreateLotteryFormValues>,
    name: 'winningNumbers',
  });

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user?.user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
        router.replace('/admin/login?redirect=/admin/lottery');
      }
    }
  }, [user, isAuthLoading, router, toast]);

  const { data: lotteries, isLoading, error } = useQuery<Lottery[], Error>({
    queryKey: ['adminLotteries'],
    queryFn: async () => {
      const res = await fetch('/api/admin/lottery', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch lottery programs');
      }
      return res.json().then(data => data.lotteries);
    },
    enabled: !isAuthLoading && user?.user.role === 'admin',
  });

  const createLotteryMutation = useMutation({
    mutationFn: async (newLottery: CreateLotteryFormValues) => {
      const res = await fetch('/api/admin/lottery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newLottery),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create lottery program');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotteries'] });
      toast({
        title: 'Success',
        description: data.message || 'Lottery program created successfully',
        variant: 'default',
      });
      setIsCreateLotteryDialogOpen(false);
      createLotteryForm.reset({ winningNumbers: [''] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const drawLotteryMutation = useMutation({
    mutationFn: async (lotteryId: string) => {
      const res = await fetch(`/api/admin/lottery/${lotteryId}/draw`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to draw lottery');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotteries'] });
      toast({
        title: 'Success',
        description: data.message || 'Lottery draw completed successfully',
        variant: 'default',
      });
      setDrawnWinners(data.winners || []);
      setIsDrawResultDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateLotterySubmit = (values: CreateLotteryFormValues) => {
    createLotteryMutation.mutate(values);
  };

  const handleDrawLottery = (lotteryId: string) => {
    setLotteryToDrawId(lotteryId);
    setIsConfirmDrawDialogOpen(true);
  };

  const handleConfirmDraw = () => {
    if (lotteryToDrawId) {
      drawLotteryMutation.mutate(lotteryToDrawId);
      setLotteryToDrawId(null);
      setIsConfirmDrawDialogOpen(false);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
  }

  if (!user || user?.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading lottery programs...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Manage Lottery Programs</h1>

      <div className="flex justify-end mb-4">
        <Dialog open={isCreateLotteryDialogOpen} onOpenChange={setIsCreateLotteryDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Lottery
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Lottery Program</DialogTitle>
              <DialogDescription>Enter the winning 3-digit numbers and the draw date for the lottery.</DialogDescription>
            </DialogHeader>
            <form onSubmit={createLotteryForm.handleSubmit(handleCreateLotterySubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="drawDate" className="text-right">Draw Date</label>
                <Input
                  id="drawDate"
                  type="date"
                  className="col-span-3"
                  {...createLotteryForm.register('drawDate')}
                />
              </div>
              {createLotteryForm.formState.errors.drawDate && (
                <p className="text-red-500 text-sm text-center">{createLotteryForm.formState.errors.drawDate.message}</p>
              )}
              <label className="text-left">Winning Numbers</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g., 123"
                    {...createLotteryForm.register(`winningNumbers.${index}` as const)}
                    type="text"
                    maxLength={3}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {createLotteryForm.formState.errors.winningNumbers && (
                <p className="text-red-500 text-sm">{createLotteryForm.formState.errors.winningNumbers.message}</p>
              )}
              <Button type="button" variant="outline" onClick={() => append('')}>
                Add More Winning Number
              </Button>
              <DialogFooter>
                <Button type="submit" disabled={createLotteryMutation.isPending}>
                  {createLotteryMutation.isPending ? 'Creating...' : 'Create Lottery'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Draw Date</TableHead>
              <TableHead>Winning Numbers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotteries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No lottery programs found.
                </TableCell>
              </TableRow>
            ) : (
              lotteries?.map((lottery) => (
                <TableRow key={lottery._id}>
                  <TableCell>{new Date(lottery.drawDate).toLocaleDateString()}</TableCell>
                  <TableCell>{lottery.winningNumbers.join(', ')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lottery.isActive ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {lottery.isActive ? 'Active' : 'Completed'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {lottery.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDrawLottery(lottery._id)}
                        disabled={drawLotteryMutation.isPending}
                      >
                        <Award className="mr-2 h-4 w-4" /> Draw Winners
                      </Button>
                    ) : (
                      <Link href={`/lottery/winners?id=${lottery._id}`} target="_blank">
                        <Button variant="outline" size="sm"><History className="mr-2 h-4 w-4" /> View Result</Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Draw Result Dialog */}
      <Dialog open={isDrawResultDialogOpen} onOpenChange={setIsDrawResultDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lottery Draw Results</DialogTitle>
            <DialogDescription>Winners based on the last 3 digits of Post IDs.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {drawnWinners.length === 0 ? (
              <p className="text-center">No winners found for this draw.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Winner Name</TableHead>
                    <TableHead>Post ID</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drawnWinners.map((winner, index) => (
                    <TableRow key={index}>
                      <TableCell>{winner.userId?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Link href={`/posts/${winner.postId?._id}`} target="_blank" className="hover:underline">
                          {winner.postId?.postId || 'N/A'}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{winner.postId?.description || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDrawResultDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Draw Dialog */}
      <Dialog open={isConfirmDrawDialogOpen} onOpenChange={setIsConfirmDrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lottery Draw</DialogTitle>
            <DialogDescription>
              Are you sure you want to draw winners for this lottery? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDrawDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDraw} disabled={drawLotteryMutation.isPending}>
              {drawLotteryMutation.isPending ? 'Drawing...' : 'Confirm Draw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
