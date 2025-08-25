const Rating = require('../models/rating');
const Work = require('../models/work');

exports.rateWork = async (req, res, next) => {
  try {
    const { workId, ratingValue } = req.body;
    if (!workId || typeof ratingValue === 'undefined') {
      return res.status(400).json({ message: 'workId and ratingValue are required' });
    }
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'ratingValue must be between 1 and 5' });
    }
    const work = await Work.findById(workId).select('_id');
    if (!work) return res.status(404).json({ message: 'Work not found' });
    const rating = await Rating.findOneAndUpdate(
      { userId: req.user.id, workId },
      { $set: { ratingValue } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(rating);
  } catch (err) {
    next(err);
  }
};

exports.getAverageRating = async (req, res, next) => {
  try {
    const { workId } = req.params;
    const result = await Rating.aggregate([
      { $match: { workId: new require('mongoose').Types.ObjectId(workId) } },
      { $group: { _id: '$workId', avg: { $avg: '$ratingValue' }, count: { $sum: 1 } } },
    ]);
    if (!result.length) return res.json({ average: 0, count: 0 });
    res.json({ average: Number(result[0].avg.toFixed(2)), count: result[0].count });
  } catch (err) {
    next(err);
  }
};

exports.getRatingsForPublisherWorks = async (req, res, next) => {
  try {
    const workIds = await Work.find({ createdBy: req.user.id }).distinct('_id');
    const ratings = await Rating.find({ workId: { $in: workIds } });
    res.json(ratings);
  } catch (err) {
    next(err);
  }
};

exports.getAllRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({});
    res.json(ratings);
  } catch (err) {
    next(err);
  }
};


