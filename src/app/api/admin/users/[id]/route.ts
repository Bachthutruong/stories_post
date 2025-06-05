import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const body = await request.json();
        const { isLocked } = body;

        if (typeof isLocked !== 'boolean') {
            return NextResponse.json({ message: 'isLocked must be a boolean' }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(id, { isLocked }, { new: true });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User updated successfully', user }, { status: 200 });

    } catch (error: any) {
        console.error('Update User Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Delete User Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;

        const user = await User.findById(id);

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error: any) {
        console.error('Get User Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 