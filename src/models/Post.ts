import mongoose, { Schema, models, model } from 'mongoose';

const PostSchema = new Schema({
    postId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    images: [{
        public_id: { type: String, required: true },
        url: { type: String, required: true },
    }],
    description: {
        type: String,
        required: [true, 'Please provide a description for this post.'],
    },
    likes: {
        type: Number,
        default: 0,
    },
    shares: {
        type: Number,
        default: 0,
    },
    commentsCount: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isHidden: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default models.Post || model('Post', PostSchema); 