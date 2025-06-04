import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id: postId } = params;

        if (!postId) {
            return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        post.shares += 1;
        await post.save();

        return NextResponse.json({ message: 'Share count updated successfully', shares: post.shares }, { status: 200 });

    } catch (error: any) {
        console.error('Share Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 