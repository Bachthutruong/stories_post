import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import { mockFeaturedPosts, mockTopLikedPosts, mockTopSharedPosts, mockTopCommentedPosts } from '@/lib/mock-data';
import type { Post } from '@/lib/types';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  // In a real app, this data would be fetched from an API
  const featuredPosts: Post[] = mockFeaturedPosts;
  const topLikedPosts: Post[] = mockTopLikedPosts;
  const topSharedPosts: Post[] = mockTopSharedPosts;
  const topCommentedPosts: Post[] = mockTopCommentedPosts;

  return (
    <div className="space-y-12">
      <section aria-labelledby="featured-posts-heading">
        <div className="flex justify-between items-center mb-6">
          <h2 id="featured-posts-heading" className="text-3xl font-headline text-primary">Featured Stories</h2>
          <Button variant="link" asChild>
            <Link href="/posts">View All Posts <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        {featuredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.slice(0,3).map((post) => ( // Show up to 3 featured posts directly
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured posts at the moment. Check back later!</p>
        )}
      </section>

      <section aria-labelledby="top-posts-heading">
        <h2 id="top-posts-heading" className="text-3xl font-headline text-center mb-8">Top Posts</h2>
        <Tabs defaultValue="likes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:max-w-md mx-auto mb-6">
            <TabsTrigger value="likes">Most Liked</TabsTrigger>
            <TabsTrigger value="shares">Most Shared</TabsTrigger>
            <TabsTrigger value="comments">Most Commented</TabsTrigger>
          </TabsList>
          
          <TabsContent value="likes">
            {topLikedPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topLikedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No posts to show in this category yet.</p>
            )}
          </TabsContent>
          <TabsContent value="shares">
             {topSharedPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topSharedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No posts to show in this category yet.</p>
            )}
          </TabsContent>
          <TabsContent value="comments">
            {topCommentedPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topCommentedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No posts to show in this category yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}