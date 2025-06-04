
"use client";

import { useState, useMemo } from 'react';
import { mockLotteryPrograms } from '@/lib/mock-data';
import type { LotteryProgram } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PostCard from '@/components/PostCard';
import { formatDate } from '@/lib/utils';
import { Award, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LotteryWinnersPage() {
  const [programs] = useState<LotteryProgram[]>(mockLotteryPrograms);

  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [programs]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <Award className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline text-primary">Lottery Winners Circle</h1>
        <p className="text-muted-foreground mt-2">Congratulations to all our lucky winners!</p>
      </div>

      {sortedPrograms.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {sortedPrograms.map((program, index) => (
            <AccordionItem value={`item-${index}`} key={program.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-primary">{program.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1.5" /> Drawn on: {formatDate(program.createdAt, 'PP')}
                    </p>
                  </div>
                  <Badge variant={program.winningPosts && program.winningPosts.length > 0 ? "default" : "outline"}>
                    {program.winningPosts?.length || 0} Winner(s)
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="mt-2 shadow-inner">
                  <CardHeader>
                    <CardDescription>
                      Winning Numbers for this draw: {program.winningNumbers.map(num => <Badge key={num} variant="secondary" className="mr-1 text-lg p-1">{num}</Badge>)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {program.winningPosts && program.winningPosts.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {program.winningPosts.map(post => (
                          <PostCard key={post.id} post={post} showInteractionsInitially={false} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">No winning posts found for this program's numbers.</p>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No lottery programs have been run yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for winner announcements!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
