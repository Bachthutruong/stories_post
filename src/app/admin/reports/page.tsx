
"use client";

import { useState, useMemo } from 'react';
import { mockReports, mockPosts, mockUsers } from '@/lib/mock-data';
import type { Report } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Search, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>(mockReports); // Manage reports state locally
  const [searchTerm, setSearchTerm] = useState('');

  const augmentedReports = useMemo(() => {
    return reports.map(report => {
      const post = mockPosts.find(p => p.id === report.postId);
      const reporter = report.reportedByUserId ? mockUsers.find(u => u.id === report.reportedByUserId) : null;
      return {
        ...report,
        postDescription: post ? post.description.substring(0, 50) + '...' : 'Post not found',
        reporterName: reporter ? reporter.name : report.reportedByGuestName || 'Guest',
      };
    }).sort((a,b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [reports]);

  const filteredReports = useMemo(() => {
    return augmentedReports.filter(report =>
      report.postId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [augmentedReports, searchTerm]);

  const handleDismissReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast({ title: "Report Dismissed", description: `Report ${reportId} has been dismissed.` });
  };

  const handleActionPost = (postId: string) => {
    // Placeholder for actions like "Hide Post", "Warn User"
    toast({ title: "Action Taken", description: `Further actions for post ${postId} would be handled here.` });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline text-primary">Manage Reports</h1>
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Search reports by post ID, reason, or reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported At</TableHead>
              <TableHead>Post ID / Description</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{formatDate(report.reportedAt, 'PP p')}</TableCell>
                <TableCell>
                  <Link href={`/posts/${report.postId}/edit`} className="font-medium text-primary hover:underline">{report.postId}</Link>
                  <div className="text-xs text-muted-foreground truncate">{report.postDescription}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-sm truncate">{report.reason}</TableCell>
                <TableCell>{report.reporterName}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${report.postId}/edit`}>
                          <Eye className="mr-2 h-4 w-4" /> View Post
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleActionPost(report.postId)}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Take Action on Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDismissReport(report.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Dismiss Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
