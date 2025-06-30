import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';
import Comment from '@/models/Comment';
import Like from '@/models/Like';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // Run all queries in parallel for better performance
        const [totalPosts, totalUsers, totalSharesResult, totalComments, totalLikes] = await Promise.all([
            Post.countDocuments({}),
            User.countDocuments({}),
            Post.aggregate([{ $group: { _id: null, total: { $sum: '$shares' } } }]),
            Comment.countDocuments({}),
            Like.countDocuments({})
        ]);

        const totalShares = totalSharesResult[0]?.total || 0;

        const response = NextResponse.json({
            totalPosts,
            totalUsers,
            totalShares,
            totalComments,
            totalLikes,
        }, { status: 200 });

        // Add caching headers
        response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

        return response;

    } catch (error: any) {
        console.error('Admin Get Stats Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 