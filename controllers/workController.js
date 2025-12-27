const Work = require('../models/work');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.createWork = async (req, res, next) => {
  try {
    // Parse cast (support JSON stringified array or array of objects/strings)
    let cast = req.body.cast;
    if (typeof cast === 'string') {
      try {
        cast = JSON.parse(cast);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid cast format' });
      }
    }
    if (!Array.isArray(cast)) {
      return res.status(400).json({ message: 'cast must be an array' });
    }
    // Normalize cast items: allow either string name or object { name, image }
    cast = cast
      .map((actor) => {
        if (typeof actor === 'string') return { name: actor.trim() };
        if (actor && typeof actor === 'object' && actor.name) return { name: String(actor.name).trim(), image: actor.image || undefined };
        return null;
      })
      .filter(a => a && a.name && a.name.length > 0);

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

    // Parse platforms if provided (could be JSON string)
    if (workBody.platforms && typeof workBody.platforms === 'string') {
      try {
        workBody.platforms = JSON.parse(workBody.platforms);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid platforms format' });
      }
    }

    // Normalize platforms (ensure array of {name, url})
    if (workBody.platforms) {
      if (!Array.isArray(workBody.platforms)) {
        return res.status(400).json({ message: 'platforms must be an array' });
      }
      workBody.platforms = workBody.platforms
        .map(p => (p && typeof p === 'object' && p.name && p.url) ? { name: String(p.name).toLowerCase(), url: String(p.url).trim() } : null)
        .filter(p => p && p.name && p.url);
    }

    // Normalize directorImage if provided as string (JSON or URL)
    if (workBody.directorImage && typeof workBody.directorImage === 'string') {
      try {
        const parsed = JSON.parse(workBody.directorImage);
        if (parsed && (parsed.url || parsed.secure_url)) {
          workBody.directorImage = { publicId: parsed.public_id || parsed.publicId, url: parsed.url || parsed.secure_url || parsed.secureUrl };
        }
      } catch (e) {
        // not JSON -> treat as URL
        const urlStr = String(workBody.directorImage).trim();
        if (urlStr.length > 0) {
          workBody.directorImage = { url: urlStr };
        }
      }
    }
    // Normalize assistantDirectorImage if provided as string (JSON or URL)
    if (workBody.assistantDirectorImage && typeof workBody.assistantDirectorImage === 'string') {
      try {
        const parsed = JSON.parse(workBody.assistantDirectorImage);
        if (parsed && (parsed.url || parsed.secure_url)) {
          workBody.assistantDirectorImage = { publicId: parsed.public_id || parsed.publicId, url: parsed.url || parsed.secure_url || parsed.secureUrl };
        }
      } catch (e) {
        // not JSON -> treat as URL
        const urlStr = String(workBody.assistantDirectorImage).trim();
        if (urlStr.length > 0) {
          workBody.assistantDirectorImage = { url: urlStr };
        }
      }
    }

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
    // If cast is provided as string (from multipart/form-data), parse and normalize
    if (update.cast && typeof update.cast === 'string') {
      try {
        let parsed = JSON.parse(update.cast);
        if (!Array.isArray(parsed)) return res.status(400).json({ message: 'cast must be an array' });
        parsed = parsed
          .map((actor) => {
            if (typeof actor === 'string') return { name: actor.trim() };
            if (actor && typeof actor === 'object' && actor.name) return { name: String(actor.name).trim(), image: actor.image || undefined };
            return null;
          })
          .filter(a => a && a.name && a.name.length > 0);
        update.cast = parsed;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid cast format' });
      }
    }
    // If platforms provided as string, parse and normalize
    if (update.platforms && typeof update.platforms === 'string') {
      try {
        let parsed = JSON.parse(update.platforms);
        if (!Array.isArray(parsed)) return res.status(400).json({ message: 'platforms must be an array' });
        parsed = parsed.map(p => (p && typeof p === 'object' && p.name && p.url) ? { name: String(p.name).toLowerCase(), url: String(p.url).trim() } : null).filter(p => p && p.name && p.url);
        update.platforms = parsed;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid platforms format' });
      }
    }
    // Normalize directorImage if string
    if (update.directorImage && typeof update.directorImage === 'string') {
      try {
        const parsed = JSON.parse(update.directorImage);
        if (parsed && (parsed.url || parsed.secure_url)) {
          update.directorImage = { publicId: parsed.public_id || parsed.publicId, url: parsed.url || parsed.secure_url || parsed.secureUrl };
        }
      } catch (e) {
        const urlStr = String(update.directorImage).trim();
        if (urlStr.length > 0) update.directorImage = { url: urlStr };
      }
    }
    // Normalize assistantDirectorImage if string
    if (update.assistantDirectorImage && typeof update.assistantDirectorImage === 'string') {
      try {
        const parsed = JSON.parse(update.assistantDirectorImage);
        if (parsed && (parsed.url || parsed.secure_url)) {
          update.assistantDirectorImage = { publicId: parsed.public_id || parsed.publicId, url: parsed.url || parsed.secure_url || parsed.secureUrl };
        }
      } catch (e) {
        const urlStr = String(update.assistantDirectorImage).trim();
        if (urlStr.length > 0) update.assistantDirectorImage = { url: urlStr };
      }
    }
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


