import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Lottery from '@/models/Lottery';
import Post from '@/models/Post';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id: lotteryId } = await params;

        const lottery = await Lottery.findById(lotteryId);

        if (!lottery) {
            return NextResponse.json({ message: 'Lottery program not found' }, { status: 404 });
        }

        if (!lottery.isActive) {
            return NextResponse.json({ message: 'Lottery program is not active' }, { status: 400 });
        }

        const winningNumbers = lottery.winningNumbers.map((num: string) => num.padStart(3, '0'));

        // Find posts whose postId ends with any of the winning numbers
        const winningPosts = await Post.find({
            'postId': { $regex: new RegExp(`(${winningNumbers.join('|')})$`) }
        }).populate('userId', 'name phoneNumber email');

        const winners = winningPosts.map(post => ({
            userId: post.userId,
            postId: post._id,
        }));

        lottery.winners = winners;
        lottery.isActive = false; // Deactivate lottery after drawing
        await lottery.save();

        return NextResponse.json({ message: 'Lottery draw completed successfully', winners }, { status: 200 });

    } catch (error: any) {
        console.error('Lottery Draw Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 