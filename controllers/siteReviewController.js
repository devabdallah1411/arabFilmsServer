const SiteReview = require('../models/siteReview');
const User = require('../models/user');

exports.createOrUpdateSiteReview = async (req, res, next) => {
  try {
    const { ratingValue, description } = req.body;
    if (!ratingValue || !description) return res.status(400).json({ message: 'ratingValue and description are required' });
    if (ratingValue < 1 || ratingValue > 5) return res.status(400).json({ message: 'ratingValue must be 1-5' });

    // Fetch user to get the username
    const user = await User.findById(req.user.id).select('username');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const review = await SiteReview.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { username: user.username, ratingValue, description } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

exports.getSiteReviews = async (req, res, next) => {
  try {
    const reviews = await SiteReview.find({}).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};


