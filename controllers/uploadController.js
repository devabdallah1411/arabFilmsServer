const { uploadToCloudinary } = require('../utils/cloudinary');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      folder: 'arabfilm/posters',
      resource_type: 'image',
    });

    res.json({
      message: 'Image uploaded successfully',
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
      },
    });
  } catch (error) {
    next(error);
  }
};
