const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        mediaType: {
            type: String,
            enum: ['image', 'video'],
            required: true,
        },
        media: {
            publicId: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for faster queries
advertisementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
