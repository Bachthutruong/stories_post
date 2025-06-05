"use client";

import { useState, useMemo, useEffect } from 'react';
import type { LotteryProgram } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PostCard from '@/components/PostCard';
import { formatDate } from '@/lib/utils';
import { Award, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LotteryWinnersPage() {
  const [programs, setPrograms] = useState<LotteryProgram[]>([]);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const response = await fetch('/api/lottery/winners');
        if (!response.ok) {
          throw new Error('Failed to fetch lottery winners');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setPrograms(data);
        } else {
          console.warn("API response is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching lottery winners:", error);
        // Optionally set an error state here
      }
    };

    fetchWinners();
  }, []);

  const sortedPrograms = useMemo(() => {
    // Ensure programs is treated as an array before sorting
    const programsArray = Array.isArray(programs) ? programs : [];
    if (programsArray.length === 0) {
      return []; // Return empty array if no programs or not an array
    }
    // Use slice() to create a copy, potentially more resilient
    return programsArray.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            <AccordionItem value={`item-${index}`} key={`${program.id}-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="text-left">
                    <h2 className="text-xl font-semibold text-primary">{program.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1.5" /> Drawn on: {formatDate(program.drawDate)}
                    </p>
                  </div>
                  <Badge variant={program.winners && Array.isArray(program.winners) && program.winners.length > 0 ? "default" : "outline"}>
                    {program.winners && Array.isArray(program.winners) ? program.winners.length : 0} Winner(s)
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
                    {program.winners && Array.isArray(program.winners) && program.winners.length > 0 ? (
                      <div className="space-y-4">
                        {program.winners.map((winnerEntry) => (
                           <Card key={`${program.id}-${winnerEntry._id}`} className="p-4">
                              <CardTitle className="text-lg">{winnerEntry.userId?.name || 'Người dùng ẩn danh'}</CardTitle>
                              <CardDescription className="text-sm">Số điện thoại: {winnerEntry.userId?.phoneNumber || 'N/A'}</CardDescription>
                              {/* Optionally display winning post ID or link */}
                              {/* <p className="text-sm text-muted-foreground mt-1">Winning Post ID: {winnerEntry.postId}</p> */}
                           </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">Chưa có người trúng thưởng nào cho chương trình này.</p>
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
