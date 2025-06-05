import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Comment from '@/models/Comment';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const comment = await Comment.findById(id).populate('userId', 'name phoneNumber email');

        if (!comment) {
            return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
        }

        return NextResponse.json({ comment }, { status: 200 });
    } catch (error: any) {
        console.error('Admin Get Single Comment Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const body = await request.json();
        const { content, status } = body;

        const comment = await Comment.findById(id);
        if (!comment) {
            return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
        }

        if (content !== undefined) {
            comment.content = content;
        }
        if (status !== undefined) {
            comment.status = status;
        }

        await comment.save();

        return NextResponse.json({ message: 'Comment updated successfully', comment }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Update Comment Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const comment = await Comment.findById(id);

        if (!comment) {
            return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
        }

        await Comment.deleteOne({ _id: id });

        return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Delete Comment Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 