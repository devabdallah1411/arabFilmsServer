const mongoose = require('mongoose');

const VALID_WORK_TYPES = ['film', 'series'];

const workSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: VALID_WORK_TYPES,
      required: true,
      trim: true,
    },
    nameArabic: {
      type: String,
      required: true,
      trim: true,
    },
    nameEnglish: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1800,
      max: 3000,
    },
    director: {
      type: String,
      required: true,
      trim: true,
    },
    assistantDirector: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    cast: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string' && v.trim().length > 0);
        },
        message: 'cast must be a non-empty array of strings',
      },
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    filmingLocation: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    posterUrl: {
      type: String,
      required: false,
      trim: true,
    },
    seasonsCount: {
      type: Number,
      required: function () {
        return this.type === 'series';
      },
      min: 1,
    },
    episodesCount: {
      type: Number,
      required: function () {
        return this.type === 'series';
      },
      min: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Work', workSchema);


