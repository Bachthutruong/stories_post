import mongoose, { Schema, models, model } from 'mongoose';

const LotterySchema = new Schema({
    drawDate: {
        type: Date,
        required: true,
    },
    winningNumbers: [{
        type: String,
        required: true,
    }],
    winners: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
        },
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default models.Lottery || model('Lottery', LotterySchema); 