import mongoose from 'mongoose';

const InsightSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        photo: { type: String },
        recommendations: { type: [String] },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        benefits: { type: [String], default: [] },
        analysis: { type: mongoose.Schema.Types.Mixed },
        styleScore: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export default mongoose.model('Insight', InsightSchema);
