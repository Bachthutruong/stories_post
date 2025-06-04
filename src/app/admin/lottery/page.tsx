
"use client";

import { useState, useMemo } from 'react';
import { mockLotteryPrograms, mockPosts } from '@/lib/mock-data';
import type { LotteryProgram, Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, PlusCircle, Trash2, Search, CalendarDays, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { formatDate } from '@/lib/utils';
import PostCard from '@/components/PostCard';

const lotteryProgramSchema = z.object({
  name: z.string().min(5, "Program name must be at least 5 characters").max(100),
  winningNumbers: z.array(
    z.string()
      .length(3, "Winning number must be exactly 3 digits")
      .regex(/^\d{3}$/, "Winning number must be 3 digits")
  ).min(1, "At least one winning number is required"),
});
type LotteryProgramFormData = z.infer<typeof lotteryProgramSchema>;

export default function AdminLotteryPage() {
  const { toast } = useToast();
  const [lotteryPrograms, setLotteryPrograms] = useState<LotteryProgram[]>(mockLotteryPrograms);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<LotteryProgram | null>(null);

  const form = useForm<LotteryProgramFormData>({
    resolver: zodResolver(lotteryProgramSchema),
    defaultValues: { name: '', winningNumbers: [''] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "winningNumbers",
  });

  const handleCreateProgram: SubmitHandler<LotteryProgramFormData> = (data) => {
    setIsSubmitting(true);
    // Simulate scanning posts
    const winningPosts: Post[] = [];
    mockPosts.forEach(post => {
      const postSuffix = post.id.split('_HEMUNG_')[1];
      if (postSuffix && data.winningNumbers.includes(postSuffix.substring(0,3))) {
        winningPosts.push(post);
      }
    });

    const newProgram: LotteryProgram = {
      id: `lottery${Date.now()}`, // Mock ID
      name: data.name,
      winningNumbers: data.winningNumbers,
      createdAt: new Date().toISOString(),
      winningPosts: winningPosts,
    };
    setLotteryPrograms(prev => [newProgram, ...prev]);
    toast({ title: "Lottery Program Created", description: `Program "${data.name}" created with ${winningPosts.length} winner(s).` });
    form.reset({ name: '', winningNumbers: [''] });
    setShowCreateForm(false);
    setIsSubmitting(false);
  };

  const handleDeleteProgram = (programId: string) => {
    setLotteryPrograms(prev => prev.filter(p => p.id !== programId));
    toast({ title: "Program Deleted", description: `Lottery program ${programId} deleted.`, variant: "destructive" });
    if (selectedProgram?.id === programId) setSelectedProgram(null);
  };
  
  const sortedPrograms = useMemo(() => {
    return [...lotteryPrograms].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [lotteryPrograms]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline text-primary">Lottery Programs</h1>
        <Button onClick={() => { setShowCreateForm(prev => !prev); form.reset({ name: '', winningNumbers: [''] }); setSelectedProgram(null);}}>
          <PlusCircle className="mr-2 h-4 w-4" /> {showCreateForm ? 'Cancel' : 'Create New Program'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Lottery Program</CardTitle>
            <CardDescription>Define winning numbers to find matching posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateProgram)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Grand Prize Draw - February" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Winning Numbers (3 digits each)</FormLabel>
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-2 mt-2">
                      <FormField
                        control={form.control}
                        name={`winningNumbers.${index}` as const}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl><Input placeholder="e.g., 123" {...field} maxLength={3} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append('')} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Winning Number
                  </Button>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  <Award className="mr-2 h-4 w-4" /> {isSubmitting ? 'Creating...' : 'Create and Scan Winners'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Lottery Programs ({sortedPrograms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPrograms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead className="hidden md:table-cell">Winning Numbers</TableHead>
                  <TableHead><Users className="inline h-4 w-4 mr-1" />Winners</TableHead>
                  <TableHead className="hidden sm:table-cell"><CalendarDays className="inline h-4 w-4 mr-1" />Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPrograms.map(program => (
                  <TableRow key={program.id} className={selectedProgram?.id === program.id ? "bg-muted" : ""}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {program.winningNumbers.map(num => <Badge key={num} variant="secondary" className="mr-1">{num}</Badge>)}
                    </TableCell>
                    <TableCell>{program.winningPosts?.length || 0}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(program.createdAt, 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => {setSelectedProgram(program); setShowCreateForm(false);}} className="mr-2">
                        <Eye className="mr-1 h-4 w-4" /> View Winners
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteProgram(program.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No lottery programs created yet.</p>
          )}
        </CardContent>
      </Card>

      {selectedProgram && (
        <Card>
          <CardHeader>
            <CardTitle>Winners for: {selectedProgram.name}</CardTitle>
            <CardDescription>
              Winning Numbers: {selectedProgram.winningNumbers.join(', ')} | Found {selectedProgram.winningPosts?.length || 0} winning post(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProgram.winningPosts && selectedProgram.winningPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProgram.winningPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No winning posts found for this program.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
