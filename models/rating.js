const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workId: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true, index: true },
    ratingValue: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true, versionKey: false }
);

ratingSchema.index({ userId: 1, workId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);


