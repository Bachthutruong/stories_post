import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';
import Comment from '@/models/Comment';
import Like from '@/models/Like';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // This route would be protected by admin middleware
        const totalPosts = await Post.countDocuments({});
        const totalUsers = await User.countDocuments({});
        const totalShares = (await Post.aggregate([{ $group: { _id: null, total: { $sum: '$shares' } } }]))[0]?.total || 0;
        const totalComments = await Comment.countDocuments({});
        const totalLikes = await Like.countDocuments({});

        return NextResponse.json({
            totalPosts,
            totalUsers,
            totalShares,
            totalComments,
            totalLikes,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get Stats Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 