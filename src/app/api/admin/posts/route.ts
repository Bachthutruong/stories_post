import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // This route would be protected by admin middleware
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const filterBy = searchParams.get('filterBy') || 'createdAt'; // Default filter
        const sortOrder = searchParams.get('sortOrder') || 'desc'; // Default sort

        const limit = 10; // Number of posts per page
        const skip = (page - 1) * limit;

        let postFilter: any = {};
        let userFilter: any = {};

        if (searchQuery) {
            // Find users matching the search query in name or phoneNumber
            userFilter = {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { phoneNumber: { $regex: searchQuery, $options: 'i' } },
                ],
            };

            const matchingUsers = await User.find(userFilter).select('_id');
            const userIds = matchingUsers.map(user => user._id);

            // If no users match, no posts will match either
            if (userIds.length === 0) {
                return NextResponse.json({ posts: [], currentPage: 1, totalPages: 0, totalPosts: 0 }, { status: 200 });
            }

            postFilter.userId = { $in: userIds };
        }

        // Add filtering for isFeatured, isHidden, and status
        if (filterBy === 'isFeatured') {
            postFilter.isFeatured = true;
        } else if (filterBy === 'isHidden') {
            postFilter.isHidden = true;
        } else if (['approved', 'pending_review', 'rejected'].includes(filterBy)) {
            postFilter.status = filterBy; // Filter by status
        }

        // Define sorting options
        let sortOptions: any = {};
        if (filterBy && filterBy !== 'none') {
            // Handle sorting for likes, shares, commentsCount, createdAt directly
            if (['likes', 'shares', 'commentsCount', 'createdAt'].includes(filterBy)) {
                sortOptions[filterBy] = sortOrder === 'asc' ? 1 : -1;
            }
            // isFeatured and isHidden are now handled in filtering, so remove from sort
            // else if (filterBy === 'isFeatured') {
            //      sortOptions['isFeatured'] = sortOrder === 'asc' ? 1 : -1;
            // } else if (filterBy === 'isHidden') {
            //      sortOptions['isHidden'] = sortOrder === 'asc' ? 1 : -1;
            // }
        } else {
            // Default sort by createdAt if no filter specified
            sortOptions['createdAt'] = -1; // Descending
        }

        // Get total number of posts matching the filter
        const totalPosts = await Post.countDocuments(postFilter);
        const totalPages = Math.ceil(totalPosts / limit);

        // Fetch posts with pagination, filter, and sort
        const posts = await Post.find(postFilter)
            .populate('userId', 'name phoneNumber email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get All Posts Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 