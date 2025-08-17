const Work = require('../models/work');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.createWork = async (req, res, next) => {
  try {
    const work = await Work.create(req.body);
    res.status(201).json(work);
  } catch (error) {
    next(error);
  }
};

exports.createWorkWithImage = async (req, res, next) => {
  try {
    let posterUrl = null;

    // Check if image file is uploaded
    if (req.file) {
      // Upload image to Cloudinary
      const result = await uploadToCloudinary(req.file.path, {
        folder: 'arabfilm/posters',
        resource_type: 'image',
      });
      posterUrl = result.secure_url;
    } else if (req.body.posterUrl) {
      // Use provided poster URL
      posterUrl = req.body.posterUrl;
    } else {
      // Neither image file nor posterUrl provided
      return res.status(400).json({ 
        message: 'Either image file or posterUrl must be provided' 
      });
    }

    // Parse cast if it's a string
    let cast = req.body.cast;
    if (typeof cast === 'string') {
      try {
        cast = JSON.parse(cast);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid cast format' });
      }
    }

    // Create work with the poster URL
    const workData = {
      ...req.body,
      cast: cast,
      posterUrl: posterUrl,
    };

    const work = await Work.create(workData);
    res.status(201).json(work);
  } catch (error) {
    next(error);
  }
};

exports.getAllWorks = async (req, res, next) => {
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
    const work = await Work.findByIdAndUpdate(id, req.body, {
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


