"use client"; 

import { useState, useMemo } from 'react';
import PostCard from '@/components/PostCard';
import { mockPosts } from '@/lib/mock-data';
import type { Post } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ThumbsUp, MessageSquare, Share2Icon } from 'lucide-react';

export default function AllPostsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTime, setFilterTime] = useState('all'); // 'all', 'today', 'week', 'month'
  const [filterLikes, setFilterLikes] = useState('all'); // 'all', 'most', 'least'
  const [filterShares, setFilterShares] = useState('all'); // 'all', 'most', 'least'
  const [filterComments, setFilterComments] = useState('all'); // 'all', 'most', 'least'

  const filteredPosts = useMemo(() => {
    let posts = [...mockPosts];

    if (searchTerm) {
      posts = posts.filter(post => 
        post.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.userPhone.includes(searchTerm) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const now = new Date();
    let oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    let oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    if (filterTime === 'today') {
      posts = posts.filter(post => new Date(post.createdAt).toDateString() === now.toDateString());
    } else if (filterTime === 'week') {
      posts = posts.filter(post => new Date(post.createdAt) >= oneWeekAgo);
    } else if (filterTime === 'month') {
      posts = posts.filter(post => new Date(post.createdAt) >= oneMonthAgo);
    }

    if (filterLikes === 'most') {
      posts.sort((a, b) => b.likeCount - a.likeCount);
    } else if (filterLikes === 'least') {
      posts.sort((a, b) => a.likeCount - b.likeCount);
    }

    if (filterShares === 'most') {
      posts.sort((a, b) => b.shareCount - a.shareCount);
    } else if (filterShares === 'least') {
      posts.sort((a, b) => a.shareCount - b.shareCount);
    }

    if (filterComments === 'most') {
      posts.sort((a, b) => b.commentCount - a.commentCount);
    } else if (filterComments === 'least') {
      posts.sort((a, b) => a.commentCount - b.commentCount);
    }
    
    return posts;
  }, [searchTerm, filterTime, filterLikes, filterShares, filterComments]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline text-primary">All Stories</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 bg-card rounded-lg shadow sticky top-[calc(theme(spacing.16)+1px)] z-10"> {/* Adjust top based on header height */}
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
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
               <ThumbsUp className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Likes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Likes</SelectItem>
              <SelectItem value="most">Most Liked</SelectItem>
              <SelectItem value="least">Least Liked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterShares} onValueChange={setFilterShares}>
            <SelectTrigger className="w-full">
               <Share2Icon className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Shares" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shares</SelectItem>
              <SelectItem value="most">Most Shared</SelectItem>
              <SelectItem value="least">Least Shared</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterComments} onValueChange={setFilterComments}>
            <SelectTrigger className="w-full">
               <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Comments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="most">Most Commented</SelectItem>
              <SelectItem value="least">Least Commented</SelectItem>
            </SelectContent>
          </Select>
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
