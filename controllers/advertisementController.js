const Advertisement = require('../models/advertisement');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// Create advertisement (admin only)
exports.createAdvertisement = async (req, res, next) => {
    try {
        const { name, mediaType, mediaData } = req.body;

        // Validate mediaType
        if (!mediaType || !['image', 'video'].includes(mediaType)) {
            return res.status(400).json({ message: 'mediaType must be either "image" or "video"' });
        }

        let mediaUpload;

        // Handle file upload (multipart/form-data)
        if (req.file) {
            try {
                const resourceType = mediaType === 'video' ? 'video' : 'image';
                mediaUpload = await uploadToCloudinary(req.file.path, {
                    folder: 'arabfilm/advertisements',
                    resource_type: resourceType
                });
            } catch (uploadErr) {
                return res.status(400).json({
                    message: 'Failed to upload media file',
                    error: uploadErr.message
                });
            }
        }
        // Handle base64/data URI
        else if (mediaData) {
            try {
                const resourceType = mediaType === 'video' ? 'video' : 'image';
                mediaUpload = await uploadToCloudinary(mediaData, {
                    folder: 'arabfilm/advertisements',
                    resource_type: resourceType
                });
            } catch (uploadErr) {
                return res.status(400).json({
                    message: 'Failed to upload media data',
                    error: uploadErr.message
                });
            }
        } else {
            return res.status(400).json({ message: 'Media file or data is required' });
        }

        const advertisement = await Advertisement.create({
            name,
            mediaType,
            media: {
                publicId: mediaUpload.public_id,
                url: mediaUpload.secure_url
            },
            createdBy: req.user.id
        });

        res.status(201).json(advertisement);
    } catch (err) {
        next(err);
    }
};

// Get all advertisements (admin only)
exports.getAllAdvertisements = async (req, res, next) => {
    try {
        const advertisements = await Advertisement.find({})
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });

        res.json({
            count: advertisements.length,
            advertisements
        });
    } catch (err) {
        next(err);
    }
};

// Get active advertisements (public)
exports.getActiveAdvertisements = async (req, res, next) => {
    try {
        const advertisements = await Advertisement.find({ isActive: true })
            .select('-createdBy')
            .sort({ createdAt: -1 });

        res.json({
            count: advertisements.length,
            advertisements
        });
    } catch (err) {
        next(err);
    }
};

// Get advertisement by ID (admin only)
exports.getAdvertisementById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const advertisement = await Advertisement.findById(id)
            .populate('createdBy', 'username email');

        if (!advertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        res.json(advertisement);
    } catch (err) {
        next(err);
    }
};

// Update advertisement (admin only)
exports.updateAdvertisement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const advertisement = await Advertisement.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!advertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        res.json(advertisement);
    } catch (err) {
        next(err);
    }
};

// Toggle advertisement status (admin only)
exports.toggleAdvertisementStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const advertisement = await Advertisement.findById(id);

        if (!advertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        advertisement.isActive = !advertisement.isActive;
        await advertisement.save();

        res.json({
            message: `Advertisement ${advertisement.isActive ? 'activated' : 'deactivated'} successfully`,
            advertisement
        });
    } catch (err) {
        next(err);
    }
};

// Delete advertisement (admin only)
exports.deleteAdvertisement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const advertisement = await Advertisement.findById(id);

        if (!advertisement) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        // Delete media from Cloudinary
        try {
            const resourceType = advertisement.mediaType === 'video' ? 'video' : 'image';
            await deleteFromCloudinary(advertisement.media.publicId, resourceType);
        } catch (cloudinaryErr) {
            console.error('Failed to delete media from Cloudinary:', cloudinaryErr);
            // Continue with deletion even if Cloudinary deletion fails
        }

        await Advertisement.findByIdAndDelete(id);

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
