import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // Featured posts (admin-selected)
        const featuredPosts = await Post.find({ isFeatured: true, isHidden: false })
            .sort({ createdAt: -1 })
            .limit(10) // Limit to a reasonable number
            .populate('userId', 'name phoneNumber email');

        // Top 6 posts by likes
        const topLikedPosts = await Post.find({ isHidden: false })
            .sort({ likes: -1, createdAt: -1 })
            .limit(6)
            .populate('userId', 'name phoneNumber email');

        // Top 6 posts by shares
        const topSharedPosts = await Post.find({ isHidden: false })
            .sort({ shares: -1, createdAt: -1 })
            .limit(6)
            .populate('userId', 'name phoneNumber email');

        // Top 6 posts by comments
        const topCommentedPosts = await Post.find({ isHidden: false })
            .sort({ commentsCount: -1, createdAt: -1 })
            .limit(6)
            .populate('userId', 'name phoneNumber email');

        return NextResponse.json({
            featuredPosts,
            topLikedPosts,
            topSharedPosts,
            topCommentedPosts,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Homepage Data Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 