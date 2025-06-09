import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import { authMiddleware } from '@/lib/middleware/auth';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
    await dbConnect();

    try {
        const userId = await params.userId;

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        const posts = await Post.find({ userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name phoneNumber email');

        return NextResponse.json(posts, { status: 200 });

    } catch (error: any) {
        console.error('Get User Posts Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 