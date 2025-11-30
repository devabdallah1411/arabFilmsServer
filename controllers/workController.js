const Work = require('../models/work');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.createWork = async (req, res, next) => {
  try {
    // Parse cast if it's a string (for multipart/form-data)
    let cast = req.body.cast;
    if (typeof cast === 'string') {
      try {
        cast = JSON.parse(cast);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid cast format' });
      }
    }
    // تنظيف مصفوفة cast
    if (Array.isArray(cast)) {
      cast = cast.filter(actor => typeof actor === 'string' && actor.trim() !== '');
    }

    const workBody = { ...req.body, cast };
    if (req.user) {
      workBody.createdBy = req.user.id;
    }

    // Handle poster - Priority 1: File upload (multipart)
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.path, {
          folder: 'arabfilm/posters',
          resource_type: 'image'
        });
        workBody.posterImage = {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url
        };
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Failed to upload poster file', error: uploadErr.message });
      }
    }
    // Priority 2: Base64/Data URI image
    else if (req.body.posterImage && !req.body.posterUrl) {
      try {
        const uploadResult = await uploadToCloudinary(req.body.posterImage, { folder: 'arabfilm/posters' });
        workBody.posterImage = {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url
        };
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Failed to upload poster image', error: uploadErr.message });
      }
    }
    // Priority 3: posterUrl is already in workBody from req.body

    const work = await Work.create(workBody);
    res.status(201).json(work);
  } catch (error) {
    next(error);
  }
};


exports.getAllWorks = async (req, res, next) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'publisher') {
      query.createdBy = req.user.id;
    }
    const works = await Work.find(query).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    next(error);
  }
};

// New function for public access to all works
exports.getAllWorksPublic = async (req, res, next) => {
  try {
    const works = await Work.find({}).sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    next(error);
  }
};

exports.getWorkById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const work = await Work.findById(id);
    if (!work) return res.status(404).json({ message: 'Work not found' });
    res.json(work);
  } catch (error) {
    next(error);
  }
};

exports.updateWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Prevent ownership changes via update
    const update = { ...req.body };
    delete update.createdBy;
    const work = await Work.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!work) return res.status(404).json({ message: 'Work not found' });
    res.json(work);
  } catch (error) {
    next(error);
  }
};

exports.deleteWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const work = await Work.findByIdAndDelete(id);
    if (!work) return res.status(404).json({ message: 'Work not found' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Get all movies
exports.getAllMovies = async (req, res, next) => {
  try {
    const movies = await Work.find({ type: 'film' }).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

// Get all series
exports.getAllSeries = async (req, res, next) => {
  try {
    const series = await Work.find({ type: 'series' }).sort({ createdAt: -1 });
    res.json(series);
  } catch (error) {
    next(error);
  }
};

// Get latest movies sorted by year (newest first)
exports.getLatestMovies = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const movies = await Work.find({ type: 'film' })
      .sort({ year: -1, createdAt: -1 })
      .limit(limit);
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

// Get latest series sorted by year (newest first)
exports.getLatestSeries = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const series = await Work.find({ type: 'series' })
      .sort({ year: -1, createdAt: -1 })
      .limit(limit);
    res.json(series);
  } catch (error) {
    next(error);
  }
};


