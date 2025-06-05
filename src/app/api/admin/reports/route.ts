import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Report from '@/models/Report';
import Post from '@/models/Post'; // For populating post details
import User from '@/models/User'; // For populating user details
import mongoose from 'mongoose'; // Import mongoose

export async function GET(request: Request) {
    await dbConnect();

    try {
        // This route would be protected by admin middleware
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        const searchQuery = searchParams.get('search') || '';
        const filterStatus = searchParams.get('status') || 'all';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = 10; // Define items per page

        const filter: any = {};

        // Filter by status
        if (filterStatus !== 'all') {
            filter.status = filterStatus;
        }

        // Search by post ID or reportedByUserName
        if (searchQuery) {
            const searchConditions: any[] = [];

            // Add condition for reportedByUserName (case-insensitive partial match)
            searchConditions.push({ reportedByUserName: new RegExp(searchQuery, 'i') });

            // Check if searchQuery is a valid ObjectId and add condition for postId
            if (mongoose.Types.ObjectId.isValid(searchQuery)) {
                searchConditions.push({ postId: new mongoose.Types.ObjectId(searchQuery) });
            }

            // Apply $or operator if there are multiple search conditions
            if (searchConditions.length > 0) {
                filter.$or = searchConditions;
            }
        }

        const skipAmount = (page - 1) * pageSize;

        // Fetch filtered and paginated reports
        const reports = await Report.find(filter)
            .populate('postId', 'postId description images') // Populate relevant post info
            .populate('userId', 'name phoneNumber email') // Populate relevant user info
            .skip(skipAmount)
            .limit(pageSize);

        // Get total count for pagination
        const totalReports = await Report.countDocuments(filter);
        const totalPages = Math.ceil(totalReports / pageSize);

        return NextResponse.json({
            reports,
            currentPage: page,
            totalPages,
            totalReports,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Admin Get All Reports Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 