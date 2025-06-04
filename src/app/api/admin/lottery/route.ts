import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Lottery from '@/models/Lottery';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { drawDate, winningNumbers } = body;

        if (!drawDate || !winningNumbers || !Array.isArray(winningNumbers) || winningNumbers.length === 0) {
            return NextResponse.json({ message: 'Draw date and at least one winning number are required' }, { status: 400 });
        }

        const newLottery = await Lottery.create({
            drawDate,
            winningNumbers,
        });

        return NextResponse.json({ message: 'Lottery program created successfully', lottery: newLottery }, { status: 201 });

    } catch (error: any) {
        console.error('Admin Create Lottery Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await dbConnect();

    try {
        const lotteries = await Lottery.find({});

        return NextResponse.json({ lotteries }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get Lotteries Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 