"use client"; // For client-side search/filter state

import { useState, useMemo } from 'react';
import PostCard from '@/components/PostCard';
import { mockPosts } from '@/lib/mock-data';
import type { Post } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

export default function AllPostsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTime, setFilterTime] = useState('all'); // 'all', 'today', 'week', 'month'
  const [filterLikes, setFilterLikes] = useState('all'); // 'all', 'most', 'least'
  // Add more filters for shares, comments as needed

  const filteredPosts = useMemo(() => {
    let posts = [...mockPosts];

    // Search
    if (searchTerm) {
      posts = posts.filter(post => 
        post.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.userPhone.includes(searchTerm) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by Time (example implementation)
    const now = new Date();
    if (filterTime === 'today') {
      posts = posts.filter(post => new Date(post.createdAt).toDateString() === now.toDateString());
    } else if (filterTime === 'week') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      posts = posts.filter(post => new Date(post.createdAt) >= oneWeekAgo);
    } // etc. for month

    // Filter by Likes (example)
    if (filterLikes === 'most') {
      posts.sort((a, b) => b.likeCount - a.likeCount);
    } else if (filterLikes === 'least') {
      posts.sort((a, b) => a.likeCount - b.likeCount);
    }
    
    return posts;
  }, [searchTerm, filterTime, filterLikes]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline text-primary">All Stories</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card rounded-lg shadow">
        <div className="md:col-span-1">
          <div className="relative">
            <Input 
              type="text"
              placeholder="Search by name, phone, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 md:col-span-2">
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLikes} onValueChange={setFilterLikes}>
            <SelectTrigger className="w-full sm:w-auto">
               <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Likes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Likes</SelectItem>
              <SelectItem value="most">Most Liked</SelectItem>
              <SelectItem value="least">Least Liked</SelectItem>
            </SelectContent>
          </Select>
          {/* Add more Select components for share, comment filters */}
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} showInteractionsInitially={false}/>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">No posts match your criteria. Try adjusting your search or filters.</p>
      )}
    </div>
  );
}