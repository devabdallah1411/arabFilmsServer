const mongoose = require('mongoose');

const siteReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    username: { type: String, required: true, trim: true },
    ratingValue: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('SiteReview', siteReviewSchema);


