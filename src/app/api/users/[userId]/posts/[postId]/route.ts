import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import cloudinary from '@/lib/cloudinary';
import { authMiddleware } from '@/lib/middleware/auth';

export async function PUT(request: NextRequest, { params }: { params: { userId: string, postId: string } }) {
    await dbConnect();

    return authMiddleware(async (req: NextRequest, { params: authParams }: { params: { [key: string]: string } }) => {
        const authenticatedUserId = (req as any).userId; // userId attached by authMiddleware
        const { userId, postId } = params;

        if (authenticatedUserId !== userId) {
            return NextResponse.json({ message: 'Unauthorized: You can only edit your own posts.' }, { status: 403 });
        }

        try {
            const formData = await req.formData();

            const description = formData.get('description') as string;
            const newFiles = formData.getAll('images') as File[];
            const existingImagePublicIds = formData.getAll('existingImagePublicIds') as string[];

            const post = await Post.findById(postId);
            if (!post) {
                return NextResponse.json({ message: 'Post not found' }, { status: 404 });
            }

            if (post.userId.toString() !== authenticatedUserId) {
                return NextResponse.json({ message: 'Unauthorized: You can only edit your own posts.' }, { status: 403 });
            }

            // Handle existing images - remove if not in existingImagePublicIds
            const updatedImages = post.images.filter((img: any) =>
                existingImagePublicIds.includes(img.public_id)
            );

            // Delete images from Cloudinary that are no longer in the post
            const imagesToDelete = post.images.filter((img: any) =>
                !existingImagePublicIds.includes(img.public_id)
            );

            for (const img of imagesToDelete) {
                await cloudinary.uploader.destroy(img.public_id);
            }

            // Upload new images to Cloudinary
            for (const file of newFiles) {
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

                updatedImages.push({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                });
            }

            post.description = description || post.description;
            post.images = updatedImages;

            await post.save();

            return NextResponse.json({ message: 'Post updated successfully', post }, { status: 200 });

        } catch (error: any) {
            console.error('User Update Post Error:', error);
            return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
        }
    })(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string, postId: string } }) {
    await dbConnect();

    return authMiddleware(async (req: NextRequest, { params: authParams }: { params: { [key: string]: string } }) => {
        const authenticatedUserId = (req as any).userId;
        const { userId, postId } = params;

        if (authenticatedUserId !== userId) {
            return NextResponse.json({ message: 'Unauthorized: You can only delete your own posts.' }, { status: 403 });
        }

        try {
            const post = await Post.findById(postId);

            if (!post) {
                return NextResponse.json({ message: 'Post not found' }, { status: 404 });
            }

            if (post.userId.toString() !== authenticatedUserId) {
                return NextResponse.json({ message: 'Unauthorized: You can only delete your own posts.' }, { status: 403 });
            }

            // Delete images from Cloudinary
            for (const image of post.images) {
                await cloudinary.uploader.destroy(image.public_id);
            }

            await Post.deleteOne({ _id: postId });

            return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

        } catch (error: any) {
            console.error('User Delete Post Error:', error);
            return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
        }
    })(request, { params });
}

export const config = {
    api: {
        bodyParser: false,
    },
}; 