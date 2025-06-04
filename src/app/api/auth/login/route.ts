import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { phoneNumber, password } = body;

        if (!phoneNumber || !password) {
            return NextResponse.json({ message: 'Please provide phone number and password' }, { status: 400 });
        }

        // Find user by phone number
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check if user is locked
        if (user.isLocked) {
            return NextResponse.json({ message: 'Your account has been locked. Please contact support.' }, { status: 403 });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT token
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