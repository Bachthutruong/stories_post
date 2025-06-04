import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import Comment from '@/models/Comment';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id: postId } = params;
        const body = await request.json();
        const { userId, name, content, userIp } = body;

        if (!postId || !content || (!userId && (!name || !userIp))) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        const newComment = await Comment.create({
            postId,
            userId,
            name,
            content,
            userIp,
        });

        post.commentsCount += 1;
        await post.save();

        return NextResponse.json({ message: 'Comment added successfully', comment: newComment }, { status: 201 });

    } catch (error: any) {
        console.error('Add Comment Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id: postId } = params;

        if (!postId) {
            return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
        }

        const comments = await Comment.find({ postId }).populate('userId', 'name phoneNumber email').sort({ createdAt: -1 });

        return NextResponse.json({ comments }, { status: 200 });

    } catch (error: any) {
        console.error('Get Comments Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 