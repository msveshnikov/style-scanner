import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

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
        researchPreferences: {
            field: {
                type: String,
                trim: true
            },
            dataSources: {
                type: String,
                trim: true
            },
            aiAssistance: {
                type: String
            }
        },
        presentationSettings: {
            slideLayout: {
                type: String
            },
            theme: {
                type: String
            }
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

const User = mongoose.model('User', UserSchema);

export default User;
