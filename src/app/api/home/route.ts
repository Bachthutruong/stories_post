import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // Run all queries in parallel for better performance
        const [featuredPosts, topLikedPosts, topSharedPosts, topCommentedPosts] = await Promise.all([
            // Featured posts (admin-selected)
            Post.find({ isFeatured: true, isHidden: false })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('userId', 'name phoneNumber email')
                .lean(), // Use lean() for faster queries
            
            // Top 6 posts by likes
            Post.find({ isHidden: false })
                .sort({ likes: -1, createdAt: -1 })
                .limit(6)
                .populate('userId', 'name phoneNumber email')
                .lean(),
            
            // Top 6 posts by shares
            Post.find({ isHidden: false })
                .sort({ shares: -1, createdAt: -1 })
                .limit(6)
                .populate('userId', 'name phoneNumber email')
                .lean(),
            
            // Top 6 posts by comments
            Post.find({ isHidden: false })
                .sort({ commentsCount: -1, createdAt: -1 })
                .limit(6)
                .populate('userId', 'name phoneNumber email')
                .lean(),
        ]);

        const response = NextResponse.json({
            featuredPosts,
            topLikedPosts,
            topSharedPosts,
            topCommentedPosts,
        }, { status: 200 });

        // Add caching headers
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

        return response;

    } catch (error: any) {
        console.error('Homepage Data Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 