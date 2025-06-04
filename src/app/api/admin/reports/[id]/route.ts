import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Report from '@/models/Report';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const body = await request.json();
        const { status } = body;

        if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status provided' }, { status: 400 });
        }

        const report = await Report.findByIdAndUpdate(id, { status }, { new: true });

        if (!report) {
            return NextResponse.json({ message: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Report status updated successfully', report }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Update Report Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const report = await Report.findByIdAndDelete(id);

        if (!report) {
            return NextResponse.json({ message: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Report deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Delete Report Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 