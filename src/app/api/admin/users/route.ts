import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: Request) {
    await dbConnect();

    try {
        // In a real application, this route would be protected by an admin middleware
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10'); // Assuming a default limit of 10
        const skip = (page - 1) * limit;

        let query: any = {};

        if (searchQuery) {
            // Create a case-insensitive regex for search
            const searchRegex = new RegExp(searchQuery, 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { phoneNumber: searchRegex },
                    { email: searchRegex },
                ],
            };
        }

        // Run both queries in parallel for better performance
        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .select('-password') // Exclude password from results
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean() for faster queries
            User.countDocuments(query)
        ]);

        const response = NextResponse.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        }, { status: 200 });

        // Add caching headers
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=180');

        return response;

    } catch (error: any) {
        console.error('Get All Users Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
} 