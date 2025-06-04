import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Report from '@/models/Report';
import Post from '@/models/Post'; // For populating post details
import User from '@/models/User'; // For populating user details

export async function GET(request: Request) {
    await dbConnect();

    try {
        // This route would be protected by admin middleware
        const reports = await Report.find({})
            .populate('postId', 'postId description images') // Populate relevant post info
            .populate('userId', 'name phoneNumber email'); // Populate relevant user info

        return NextResponse.json({ reports }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get All Reports Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 