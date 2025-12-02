const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'publisher'], default: 'user' },
  profileImage: {
    publicId: { type: String },
    url: { type: String }
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Work'
  }]
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);