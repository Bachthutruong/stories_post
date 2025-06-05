"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import useDebounce from '@/hooks/useDebounce';

interface Report {
  _id: string;
  postId: string | { _id: string };
  userId?: { // User who reported (optional, if anonymous) - populated
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  reportedByUserName?: string; // Name if reported anonymously
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

interface AllReportsData {
  reports: Report[];
  currentPage: number;
  totalPages: number;
  totalReports: number;
}

export default function AdminManageReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user?.user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
        router.replace('/admin/login?redirect=/admin/reports');
      }
    }
  }, [user, isAuthLoading, router, toast]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);
    params.set('page', page.toString());
    return params.toString();
  };

  useEffect(() => {
    if (!isAuthLoading && user?.user.role === 'admin') {
      const queryString = buildQueryString();
      router.push(`/admin/reports?${queryString}`, { scroll: false });
    }
  }, [debouncedSearchQuery, filterStatus, page, user, isAuthLoading]);

  const { data, isLoading, error } = useQuery<AllReportsData, Error>({
    queryKey: ['adminReports', debouncedSearchQuery, filterStatus, page],
    queryFn: async () => {
      const queryString = buildQueryString();
      const res = await fetch(`/api/admin/reports?${queryString}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      return res.json();
    },
    enabled: !isAuthLoading && user?.user.role === 'admin',
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: async (payload: { reportId: string; status: 'pending' | 'reviewed' | 'resolved' }) => {
      const res = await fetch(`/api/admin/reports/${payload.reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: payload.status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update report status');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast({
        title: 'Success',
        description: data.message || 'Report status updated successfully',
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

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete report');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast({
        title: 'Success',
        description: data.message || 'Report deleted successfully',
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

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const handleViewReportClick = (report: Report) => {
    setSelectedReport(report);
    setIsViewReportDialogOpen(true);
  };

  const handleUpdateStatus = (reportId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    updateReportStatusMutation.mutate({ reportId, status });
  };

  const handleDeleteReport = (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReportMutation.mutate(reportId);
    }
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
  }

  if (!user || user?.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Access Denied. Redirecting...</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading reports...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Manage Reports</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by post ID or reporter name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post ID</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              data?.reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell className="font-medium">
                    <Link href={`/posts/${typeof report.postId === 'object' ? report.postId._id : report.postId}`} target="_blank" className="hover:underline">
                      {typeof report.postId === 'object' ? report.postId._id : report.postId}
                    </Link>
                  </TableCell>
                  <TableCell>{report.userId?.name || report.reportedByUserName || 'Anonymous'}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right flex items-center justify-end space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleViewReportClick(report)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {report.status !== 'resolved' && (
                      <Button variant="outline" size="icon" onClick={() => handleUpdateStatus(report._id, 'resolved')} disabled={updateReportStatusMutation.isPending}>
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteReport(report._id)} disabled={deleteReportMutation.isPending}>
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center space-x-4">
        <Button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="text-sm">Page {data?.currentPage} of {data?.totalPages}</span>
        <Button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= (data?.totalPages || 1)}
          variant="outline"
        >
          Next
        </Button>
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewReportDialogOpen} onOpenChange={setIsViewReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Details - Post ID: {selectedReport?.postId ? (typeof selectedReport.postId === 'object' ? selectedReport.postId._id : selectedReport.postId) : 'N/A'}</DialogTitle>
            <DialogDescription>
              Details of the reported post and reason.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="text-sm font-medium">Reported By:</p>
              <p>{selectedReport?.userId?.name || selectedReport?.reportedByUserName || 'Anonymous'}</p>
              {selectedReport?.userId && (
                <p className="text-xs text-gray-500">({selectedReport.userId.phoneNumber} - {selectedReport.userId.email})</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Reason:</p>
              <Textarea value={selectedReport?.reason} readOnly rows={5} className="resize-none" />
            </div>
            <div>
              <p className="text-sm font-medium">Status:</p>
              <span className={`px-2 py-1 rounded-full text-sm font-semibold ${selectedReport?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selectedReport?.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {selectedReport?.status ? selectedReport.status!.charAt(0).toUpperCase() + selectedReport.status!.slice(1) : 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">Reported Date:</p>
              <p>{selectedReport?.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <Link href={`/posts/${typeof selectedReport?.postId === 'object' ? (selectedReport.postId as { _id: string })._id : selectedReport?.postId}`} target="_blank">
              <Button variant="outline" className="w-full">View Original Post</Button>
            </Link>
          </div>
          <DialogFooter>
            {selectedReport?.status !== 'resolved' && (
              <Button onClick={() => handleUpdateStatus(selectedReport!._id, 'resolved')} disabled={updateReportStatusMutation.isPending}>
                Mark as Resolved
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewReportDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
