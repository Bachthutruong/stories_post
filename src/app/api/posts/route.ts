import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import cloudinary from '@/lib/cloudinary';
import { generatePostId } from '@/lib/utils/postIdGenerator';
import bcrypt from 'bcryptjs';

// Helper function to check for safe keywords
async function containsSafeKeyword(text: string): Promise<boolean> {
    const safeKeywords = await Keyword.find({ isSafe: true });
    const lowerCaseText = text.toLowerCase();
    for (const keyword of safeKeywords) {
        if (lowerCaseText.includes(keyword.word.toLowerCase())) {
            return true;
        }
    }
    return false;
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const formData = await request.formData();

        const description = formData.get('description') as string;
        const name = formData.get('name') as string;
        const phoneNumber = formData.get('phoneNumber') as string;
        const email = formData.get('email') as string;
        const files = formData.getAll('images') as File[];
        const title = formData.get('title') as string;

        // Determine post status based on safe keywords
        const postStatus = (await containsSafeKeyword(title) || await containsSafeKeyword(description))
            ? 'approved'
            : 'pending_review';

        // Prepare email for querying and saving: use actual email or undefined if empty/null
        const effectiveEmail = email && email !== '' ? email : undefined;

        if (!title || !description || !name || !phoneNumber || files.length === 0) {
            return NextResponse.json({ message: 'Please fill all required fields and upload at least one image' }, { status: 400 });
        }

        // 1. User Handling (Register or use existing)
        let user;
        const findConditions: any[] = [{ phoneNumber }];

        // If an email is provided, add it to the search conditions.
        if (effectiveEmail) {
            findConditions.push({ email: effectiveEmail });
        }

        user = await User.findOne({ $or: findConditions });

        if (!user) {
            // Auto-register user if not found
            const hashedPassword = await bcrypt.hash(phoneNumber, 10); // Using phoneNumber as a temporary password
            const userData: any = {
                name,
                phoneNumber,
                password: hashedPassword,
            };
            // Only add email to userData if it's a non-empty string
            if (typeof effectiveEmail === 'string' && effectiveEmail !== '') {
                userData.email = effectiveEmail;
            }

            user = await User.create(userData);
            // console.warn('New user auto-registered with phone number as temporary password. Advise user to change password.');
        }

        // 2. Upload images to Cloudinary
        const uploadedImages = [];
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult: any = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            uploadedImages.push({
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url,
            });
        }

        // 3. Generate unique Post ID
        const postId = await generatePostId();

        // 4. Create new Post
        const newPost = await Post.create({
            postId,
            userId: user._id,
            images: uploadedImages,
            description,
            title,
            status: postStatus,
        });

        return NextResponse.json({ message: 'Post created successfully', post: newPost }, { status: 201 });

    } catch (error: any) {
        console.error('Create Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const filterBy = searchParams.get('filterBy') || ''; // e.g., 'createdAt', 'likes', 'shares', 'commentsCount'
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1; // 'asc' or 'desc'
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        let query: any = { isHidden: false };
        let sort: any = { createdAt: -1 };

        // Handle search by user name or phone number
        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                ],
            }).select('_id');
            const userIds = users.map(user => user._id);
            query.userId = { $in: userIds };
        }

        // Handle filtering and sorting
        if (filterBy) {
            sort = { [filterBy]: sortOrder };
        } else if (sortOrder) {
            sort = { createdAt: sortOrder }; // Default sort by createdAt if no specific filter
        }

        // Run both queries in parallel for better performance
        const [posts, totalPosts] = await Promise.all([
            Post.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'name phoneNumber email')
                .lean(), // Use lean() for faster queries
            Post.countDocuments(query)
        ]);

        const response = NextResponse.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
        }, { status: 200 });

        // Add caching headers
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');

        return response;

    } catch (error: any) {
        console.error('Get Posts Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false, // Disable body parser, will handle via formData()
    },
}; 