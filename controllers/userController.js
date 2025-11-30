const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');


exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, profileImage } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already in use' });

    const userData = { username, email, password };

    // Handle optional profile image upload
    if (profileImage) {
      try {
        const uploadResult = await uploadToCloudinary(profileImage, { folder: 'arabfilm/profiles' });
        userData.profileImage = {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url
        };
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Failed to upload profile image', error: uploadErr.message });
      }
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin-only: create user with role (admin/publisher/user)
exports.createUserByAdmin = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const allowedRoles = ['admin', 'publisher', 'user'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User with email or username already exists' });
    const user = new User({ username, email, password, role: role || 'user' });
    await user.save();
    res.status(201).json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, profileImage: user.profileImage } });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No user found with that email' });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `https://arabfilmsserver.onrender.com/api/users/reset-password/${resetToken}`;
    const message = `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>`;

    await sendEmail(user.email, 'Password Reset', message);

    res.json({ message: 'Password reset link sent to email' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
};

// Admin: list all users
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Admin: delete any user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Admin: update user (role, username, email)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['username', 'email', 'role', 'password'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (update.username !== undefined) user.username = update.username;
    if (update.email !== undefined) user.email = update.email;
    if (update.role !== undefined) user.role = update.role;
    if (update.password !== undefined) user.password = update.password;
    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

// Favorites management
exports.addToFavorites = async (req, res, next) => {
  try {
    const { workId } = req.body;
    const userId = req.user.id;

    // Check if work exists
    const Work = require('../models/work');
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    // Check if already in favorites
    const user = await User.findById(userId);
    if (user.favorites.includes(workId)) {
      return res.status(400).json({ message: 'Work is already in favorites' });
    }

    // Add to favorites
    user.favorites.push(workId);
    await user.save();

    res.json({
      message: 'Added to favorites successfully',
      favorites: user.favorites
    });
  } catch (err) {
    next(err);
  }
};

exports.removeFromFavorites = async (req, res, next) => {
  try {
    const { workId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.favorites.includes(workId)) {
      return res.status(400).json({ message: 'Work is not in favorites' });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(id => id.toString() !== workId);
    await user.save();

    res.json({
      message: 'Removed from favorites successfully',
      favorites: user.favorites
    });
  } catch (err) {
    next(err);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('favorites');

    res.json({
      favorites: user.favorites,
      count: user.favorites.length
    });
  } catch (err) {
    next(err);
  }
};

exports.checkFavoriteStatus = async (req, res, next) => {
  try {
    const { workId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const isFavorite = user.favorites.includes(workId);

    res.json({
      isFavorite,
      workId
    });
  } catch (err) {
    next(err);
  }
};

// Update user profile (authenticated user can update their own profile)
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, profileImage } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update basic fields if provided
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;

    // Handle profile image update
    if (profileImage) {
      try {
        // Delete old image if exists
        if (user.profileImage && user.profileImage.publicId) {
          await deleteFromCloudinary(user.profileImage.publicId);
        }

        // Upload new image
        const uploadResult = await uploadToCloudinary(profileImage, { folder: 'arabfilm/profiles' });
        user.profileImage = {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url
        };
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Failed to upload profile image', error: uploadErr.message });
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    next(err);
  }
};
