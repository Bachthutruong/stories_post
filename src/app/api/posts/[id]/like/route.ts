import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import Like from '@/models/Like';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id: postId } = params;
        const body = await request.json();
        const { userId, name, userIp } = body;

        if (!postId) {
            return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
        }

        if (!userId && (!name || !userIp)) {
            return NextResponse.json({ message: 'User ID or name and IP are required' }, { status: 400 });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Check if already liked
        let existingLike;
        if (userId) {
            existingLike = await Like.findOne({ postId, userId });
        } else {
            existingLike = await Like.findOne({ postId, userIp });
        }

        if (existingLike) {
            // User already liked, so unlike
            await Like.deleteOne({ _id: existingLike._id });
            post.likes = Math.max(0, post.likes - 1);
            await post.save();
            return NextResponse.json({ message: 'Post unliked successfully', likes: post.likes }, { status: 200 });
        } else {
            // Create new like
            await Like.create({
                postId,
                userId,
                name,
                userIp,
            });
            post.likes += 1;
            await post.save();
            return NextResponse.json({ message: 'Post liked successfully', likes: post.likes }, { status: 201 });
        }

    } catch (error: any) {
        console.error('Like Post Error:', error);
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

        const likes = await Like.find({ postId }).populate('userId', 'name phoneNumber email');

        return NextResponse.json({ likes }, { status: 200 });

    } catch (error: any) {
        console.error('Get Likes Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 