import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // In a real application, this route would be protected by an admin middleware
        const users = await User.find({}).select('-password'); // Exclude password from results

        return NextResponse.json({ users }, { status: 200 });

    } catch (error: any) {
        console.error('Get All Users Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 