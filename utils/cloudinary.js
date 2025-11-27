const { v2: cloudinary } = require('cloudinary');
const dotenv = require('dotenv');
// Initialize Cloudinary using environment variables
// Required envs: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
function configureCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary env vars are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Helper: upload a file (local path or data URI) to a folder, returns { public_id, secure_url }
async function uploadToCloudinary(file, options = {}) {
  const { folder = 'arabfilm', resource_type = 'image', overwrite = true } = options;
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type,
    overwrite,
  });
  return { public_id: result.public_id, secure_url: result.secure_url };
}

// Helper: delete by public_id
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  return result;
}

module.exports = {
  cloudinary,
  configureCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};


