import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';
import cloudinary from '@/lib/cloudinary';
import User from '@/models/User'; // Needed for populate

export async function GET(request: Request, { params }: { params: { id: string } }) {
    console.log("Entering GET function for post ID route.");
    await dbConnect();

    try {
        const { id } = await params;
        console.log("Received post ID:", id);
        const post = await Post.findById(id).populate('userId', 'name phoneNumber email');

        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({ post }, { status: 200 });

    } catch (error: any) {
        console.error('Get Post by ID Error:', error);
        console.error('Error details:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const formData = await request.formData();

        const description = formData.get('description') as string;
        const isFeatured = formData.get('isFeatured') === 'true';
        const isHidden = formData.get('isHidden') === 'true';
        const newFiles = formData.getAll('images') as File[];
        const existingImagePublicIds = formData.getAll('existingImagePublicIds') as string[];

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
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
        post.isFeatured = isFeatured;
        post.isHidden = isHidden;
        post.images = updatedImages;

        await post.save();

        return NextResponse.json({ message: 'Post updated successfully', post }, { status: 200 });

    } catch (error: any) {
        console.error('Update Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const { id } = params;
        const post = await Post.findById(id);

        if (!post) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Delete images from Cloudinary
        for (const image of post.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        await Post.deleteOne({ _id: id });

        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Delete Post Error:', error);
        return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false, // Disable body parser, will handle via formData()
    },
}; 