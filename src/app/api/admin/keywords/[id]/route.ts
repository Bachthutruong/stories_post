import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Keyword from '@/models/Keyword';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const body = await request.json();
        const { word } = body;

        if (!word) {
            return NextResponse.json({ message: 'Keyword is required' }, { status: 400 });
        }

        const updatedKeyword = await Keyword.findByIdAndUpdate(id, { word: word.toLowerCase() }, { new: true });

        if (!updatedKeyword) {
            return NextResponse.json({ message: 'Keyword not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Keyword updated successfully', keyword: updatedKeyword }, { status: 200 });

    } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error
            return NextResponse.json({ message: 'Keyword already exists' }, { status: 409 });
        }
        console.error('Admin Update Keyword Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const deletedKeyword = await Keyword.findByIdAndDelete(id);

        if (!deletedKeyword) {
            return NextResponse.json({ message: 'Keyword not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Keyword deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Delete Keyword Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 