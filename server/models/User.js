import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const FashionAISchema = new mongoose.Schema(
    {
        recommendedOutfitStyles: { type: [String], default: [] },
        colorPaletteSuggestions: { type: [String], default: [] },
        accessoryRecommendations: { type: [String], default: [] }
    },
    { _id: false }
);

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            trim: true,
            default: ''
        },
        lastName: {
            type: String,
            trim: true,
            default: ''
        },
        profilePicture: {
            type: String,
            default: ''
        },
        subscriptionStatus: {
            type: String,
            default: 'free'
        },
        subscriptionId: {
            type: String,
            default: ''
        },

        preferences: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        lastAiRequestTime: {
            type: Date
        },
        aiRequestCount: {
            type: Number,
            default: 0
        },
        resetPasswordToken: {
            type: String,
            default: ''
        },
        resetPasswordExpires: {
            type: Date
        },
        verificationToken: {
            type: String,
            default: ''
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        fashionAIProps: {
            type: FashionAISchema,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpires = Date.now() + 3600000;
    return resetToken;
};

UserSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(20).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
    return token;
};

UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.verificationToken;
    return obj;
};

const User = mongoose.model('User', UserSchema);

export default User;
