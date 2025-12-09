const Comment = require('../models/comment');
const Work = require('../models/work');

exports.addComment = async (req, res, next) => {
  try {
    const { workId, commentText } = req.body;
    if (!workId || !commentText) return res.status(400).json({ message: 'workId and commentText are required' });
    const work = await Work.findById(workId).select('_id createdBy');
    if (!work) return res.status(404).json({ message: 'Work not found' });
    let comment = await Comment.create({ userId: req.user.id, workId, commentText });
    // populate user info before returning so frontend can show author
    comment = await Comment.findById(comment._id).populate('userId', 'username');
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

exports.getCommentsForWork = async (req, res, next) => {
  try {
    const { workId } = req.params;
    const comments = await Comment.find({ workId }).sort({ createdAt: -1 }).populate('userId', 'username');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

exports.getCommentsForPublisherWorks = async (req, res, next) => {
  try {
    const workIds = await Work.find({ createdBy: req.user.id }).distinct('_id');
    const comments = await Comment.find({ workId: { $in: workIds } }).sort({ createdAt: -1 }).populate('userId', 'username');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

exports.getAllComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({}).sort({ createdAt: -1 }).populate('userId', 'username');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Comment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Comment not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};


