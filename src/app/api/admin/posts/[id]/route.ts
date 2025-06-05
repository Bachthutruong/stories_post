import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import cloudinary from '@/lib/cloudinary';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const post = await Post.findById(id).populate('userId', 'name phoneNumber email');

        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({ post }, { status: 200 });
    } catch (error: any) {
        console.error('Admin Get Single Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const body = await request.json();
        const { description, isFeatured, isHidden, status } = body;

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        if (description !== undefined) {
            post.description = description;
        }
        if (isFeatured !== undefined) {
            post.isFeatured = isFeatured;
        }
        if (isHidden !== undefined) {
            post.isHidden = isHidden;
        }
        if (status !== undefined) {
            post.status = status;
        }

        await post.save();

        return NextResponse.json({ message: 'Post updated successfully', post }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Update Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const post = await Post.findById(id);

        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Delete images from Cloudinary
        for (const image of post.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        // Delete associated comments
        await Comment.deleteMany({ postId: id });

        await Post.deleteOne({ _id: id });

        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Delete Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 