import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { name, phoneNumber, email, password } = body;

        if (!name || !phoneNumber || !email || !password) {
            return NextResponse.json({ message: 'Please fill all fields' }, { status: 400 });
        }

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ phoneNumber }, { email }] });
        if (userExists) {
            return NextResponse.json({ message: 'User with this phone number or email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            phoneNumber,
            email,
            password: hashedPassword,
        });

        return NextResponse.json({ message: 'User registered successfully', user: user }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 