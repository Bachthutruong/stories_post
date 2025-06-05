import mongoose, { Schema, models, model } from 'mongoose';

const KeywordSchema = new Schema({
    word: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    isSafe: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default models.Keyword || model('Keyword', KeywordSchema); 