import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Report from '@/models/Report';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id: postId } = await params;
        const body = await request.json();
        const { reason, userId } = body;

        if (!postId || !reason) {
            return NextResponse.json({ message: 'Post ID and reason are required' }, { status: 400 });
        }

        const newReport = await Report.create({
            postId,
            userId,
            reason,
        });

        return NextResponse.json({ message: 'Report submitted successfully', report: newReport }, { status: 201 });

    } catch (error: any) {
        console.error('Submit Report Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 