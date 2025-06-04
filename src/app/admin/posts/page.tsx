
"use client";

import { useState, useMemo } from 'react';
import { mockPosts, mockUsers } from '@/lib/mock-data';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Search, Eye, EyeOff, Edit, Trash2, Star, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminPostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>(mockPosts); // Manage posts state locally for demo
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  const filteredPosts = useMemo(() => {
    return posts.filter(post =>
      post.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchTerm]);

  const handleToggleFeature = (postId: string) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, isFeatured: !p.isFeatured } : p));
    toast({ title: "Post Updated", description: `Post ${postId} feature status changed.` });
  };

  const handleToggleHidden = (postId: string) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, isHidden: !p.isHidden } : p));
     toast({ title: "Post Updated", description: `Post ${postId} visibility changed.` });
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    toast({ title: "Post Deleted", description: `Post ${postId} has been deleted.`, variant: "destructive" });
  };
  
  const handleSelectPost = (postId: string, checked: boolean) => {
    setSelectedPostIds(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(postId);
      else newSet.delete(postId);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPostIds(new Set(filteredPosts.map(p => p.id)));
    } else {
      setSelectedPostIds(new Set());
    }
  };
  
  const getUserName = (userId?: string) => mockUsers.find(u => u.id === userId)?.name || 'Guest';


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline text-primary">Manage Posts</h1>
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Search posts by ID, user, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {/* Add bulk actions button if needed */}
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                 <Checkbox
                    checked={selectedPostIds.size > 0 && selectedPostIds.size === filteredPosts.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
              </TableHead>
              <TableHead>Post ID / User</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden lg:table-cell">Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id} data-state={selectedPostIds.has(post.id) ? "selected" : ""}>
                <TableCell>
                   <Checkbox
                    checked={selectedPostIds.has(post.id)}
                    onCheckedChange={(checked) => handleSelectPost(post.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{post.id}</div>
                  <div className="text-xs text-muted-foreground">{post.userName} ({post.userPhone})</div>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate">
                  {post.description}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(post.createdAt, 'PP p')}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {post.isFeatured && <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/80 text-xs">Featured</Badge>}
                    {post.isHidden && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                    {post.isFlagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                    {!(post.isFeatured || post.isHidden || post.isFlagged) && <Badge variant="outline" className="text-xs">Normal</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${post.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleFeature(post.id)}>
                        <Star className="mr-2 h-4 w-4" /> {post.isFeatured ? 'Unfeature' : 'Feature'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleHidden(post.id)}>
                        {post.isHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                        {post.isHidden ? 'Unhide' : 'Hide'}
                      </DropdownMenuItem>
                       {post.isFlagged && (
                        <DropdownMenuItem onClick={() => alert(`Reviewing flagged post: ${post.id}. Keywords: ${post.flaggedKeywords?.join(', ')}`)}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Review Flag
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {filteredPosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No posts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
