import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Comment from '@/models/Comment';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const filterBy = searchParams.get('filterBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        const limit = 20; // Temporarily reduced for testing pagination
        const skip = (page - 1) * limit;

        let commentFilter: any = {};
        let userFilter: any = {};

        if (searchQuery) {
            userFilter = {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { phoneNumber: { $regex: searchQuery, $options: 'i' } },
                ],
            };

            const matchingUsers = await User.find(userFilter).select('_id');
            const userIds = matchingUsers.map(user => user._id);

            commentFilter.$or = [
                { content: { $regex: searchQuery, $options: 'i' } },
            ];

            if (userIds.length > 0) {
                commentFilter.$or.push({ userId: { $in: userIds } });
            }
        }

        if (['approved', 'pending_review', 'rejected'].includes(filterBy)) {
            commentFilter.status = filterBy;
        }

        let sortOptions: any = {};
        sortOptions[filterBy] = sortOrder === 'asc' ? 1 : -1;

        const totalComments = await Comment.countDocuments(commentFilter);
        const totalPages = Math.ceil(totalComments / limit);

        const comments = await Comment.find(commentFilter)
            .populate('userId', 'name phoneNumber email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            comments,
            currentPage: page,
            totalPages,
            totalComments,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get All Comments Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 