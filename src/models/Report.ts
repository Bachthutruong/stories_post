import mongoose, { Schema, models, model } from 'mongoose';

const ReportSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optional if anonymous report
    },
    reason: {
        type: String,
        required: [true, 'Please provide a reason for the report.'],
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending',
    },
}, { timestamps: true });

export default models.Report || model('Report', ReportSchema); 