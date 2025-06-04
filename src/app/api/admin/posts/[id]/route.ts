import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import cloudinary from '@/lib/cloudinary';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const body = await request.json();
        const { description, isFeatured, isHidden } = body;

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

        await Post.deleteOne({ _id: id });

        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Delete Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 