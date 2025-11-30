const Rating = require('../models/rating');
const Work = require('../models/work');
const mongoose = require('mongoose');

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

    console.log('Getting average rating for workId:', workId);

    // Validate workId format
    if (!mongoose.Types.ObjectId.isValid(workId)) {
      console.log('Invalid workId format:', workId);
      return res.status(400).json({ message: 'Invalid workId format' });
    }

    const result = await Rating.aggregate([
      { $match: { workId: new mongoose.Types.ObjectId(workId) } },
      { $group: { _id: '$workId', avg: { $avg: '$ratingValue' }, count: { $sum: 1 } } },
    ]);

    console.log('Aggregation result:', result);

    if (!result.length) {
      console.log('No ratings found for workId:', workId);
      return res.json({ average: 0, count: 0 });
    }

    const response = {
      average: Number(result[0].avg.toFixed(2)),
      count: result[0].count
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('Error in getAverageRating:', err);
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

exports.getUserRating = async (req, res, next) => {
  try {
    const { workId } = req.params;

    console.log('Getting user rating for workId:', workId, 'userId:', req.user.id);

    // Validate workId format
    if (!mongoose.Types.ObjectId.isValid(workId)) {
      console.log('Invalid workId format:', workId);
      return res.status(400).json({ message: 'Invalid workId format' });
    }

    const rating = await Rating.findOne({ userId: req.user.id, workId });
    console.log('Found rating:', rating);

    if (!rating) {
      console.log('No rating found for user');
      return res.json({ ratingValue: 0 });
    }

    res.json({ ratingValue: rating.ratingValue });
  } catch (err) {
    console.error('Error in getUserRating:', err);
    next(err);
  }
};

// Get all works rated by the current user
exports.getUserRatedWorks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all ratings by this user and populate work details
    const ratings = await Rating.find({ userId })
      .populate('workId')
      .sort({ updatedAt: -1 }); // Most recently rated first

    // Filter out any ratings where work was deleted
    const validRatings = ratings.filter(rating => rating.workId !== null);

    // Format response with work details and rating
    const ratedWorks = validRatings.map(rating => ({
      work: rating.workId,
      ratingValue: rating.ratingValue,
      ratedAt: rating.updatedAt
    }));

    res.json({
      count: ratedWorks.length,
      ratings: ratedWorks
    });
  } catch (err) {
    next(err);
  }
};


