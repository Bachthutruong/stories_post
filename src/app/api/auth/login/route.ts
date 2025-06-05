import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { name, phoneNumber } = body;

        if (!name || !phoneNumber) {
            return NextResponse.json({ message: 'Please provide name and phone number' }, { status: 400 });
        }

        // Find user by name and phone number
        const user = await User.findOne({ name, phoneNumber });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check if user is locked
        if (user.isLocked) {
            return NextResponse.json({ message: 'Your account has been locked. Please contact support.' }, { status: 403 });
        }

        // Generate JWT token (you might want to reconsider token generation if no password is used)
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        return NextResponse.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, phoneNumber: user.phoneNumber, email: user.email, role: user.role } }, { status: 200 });

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 