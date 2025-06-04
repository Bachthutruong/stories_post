import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this user.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please provide a phone number for this user.'],
        unique: true,
        maxlength: [20, 'Phone number cannot be more than 20 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email for this user.'],
        unique: true,
        maxlength: [50, 'Email cannot be more than 50 characters'],
    },
    password: {
        type: String,
        required: true,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
}, { timestamps: true });

export default models.User || model('User', UserSchema); 