import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Lottery from '@/models/Lottery';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const completedLotteries = await Lottery.find({ isActive: false })
            .populate({
                path: 'winners.userId',
                select: 'name phoneNumber email'
            })
            .populate({
                path: 'winners.postId',
                select: 'postId description images'
            })
            .sort({ drawDate: -1 }); // Sort by most recent draw

        return NextResponse.json(completedLotteries, { status: 200 });

    } catch (error: any) {
        console.error('Get Lottery Winners History Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 