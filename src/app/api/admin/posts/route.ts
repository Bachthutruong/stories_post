import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // This route would be protected by admin middleware
        const posts = await Post.find({}).populate('userId', 'name phoneNumber email');

        return NextResponse.json({ posts }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get All Posts Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 