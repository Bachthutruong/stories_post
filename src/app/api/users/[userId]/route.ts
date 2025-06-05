import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
    await dbConnect();

    try {
        const { userId } = await params;

        // Basic check: Ensure the requesting user has permission to view this profile.
        // For now, we'll just fetch by ID. More robust auth/authz can be added later.
        const user = await User.findById(userId).select('-password'); // Exclude password

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error: any) {
        console.error('Get User Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
    await dbConnect();

    try {
        const { userId } = await params;
        const updateData = await request.json();

        // Prevent updating sensitive fields like role or isLocked via this route
        delete updateData.role;
        delete updateData.isLocked;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User updated successfully', user }, { status: 200 });

    } catch (error: any) {
        console.error('Update User Error:', error);
        // Check for Mongoose validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 