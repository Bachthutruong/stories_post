import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Keyword from '@/models/Keyword';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // This route would be protected by admin middleware
        const keywords = await Keyword.find({});

        return NextResponse.json({ keywords }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get Keywords Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { word } = body;

        if (!word) {
            return NextResponse.json({ message: 'Keyword is required' }, { status: 400 });
        }

        const newKeyword = await Keyword.create({ word: word.toLowerCase() }); // Store in lowercase for case-insensitive matching

        return NextResponse.json({ message: 'Keyword added successfully', keyword: newKeyword }, { status: 201 });

    } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error
            return NextResponse.json({ message: 'Keyword already exists' }, { status: 409 });
        }
        console.error('Admin Add Keyword Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 