import mongoose, { Schema, models, model, Document } from 'mongoose';

interface ILike extends Document {
    postId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    name?: string;
    userIp: string;
}

const LikeSchema = new Schema<ILike>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    name: {
        type: String,
        required: function (this: ILike) { return !this.userId; },
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    userIp: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Ensure a user/IP can only like a post once
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });
LikeSchema.index({ postId: 1, userIp: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: false } } });


export default models.Like || model<ILike>('Like', LikeSchema); 