import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Keyword from '@/models/Keyword';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const isSafeParam = searchParams.get('isSafe');

        let query: any = {};
        if (isSafeParam !== null) {
            if (isSafeParam === 'true') {
                query.isSafe = true;
            } else if (isSafeParam === 'false') {
                query = { $or: [{ isSafe: false }, { isSafe: { $exists: false } }, { isSafe: null }] };
            } else {
                // If isSafeParam is present but not 'true' or 'false', treat as default (all keywords)
                query = {};
            }
        }

        const keywords = await Keyword.find(query);

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