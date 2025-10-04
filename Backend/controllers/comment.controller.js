const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');


exports.createComment = async (req, res) => {
  try {
    const { content, task, author } = req.body;

    if (!content || !task || !author) {
      return res.status(400).json({ message: 'Content, task, and author are required' });
    }

    const taskExists = await Task.findById(task);
    if (!taskExists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userExists = await User.findById(author);
    if (!userExists) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const newComment = new Comment({ content, task, author });
    const savedComment = await newComment.save();

    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
};


exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id).populate('author', 'username email');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ message: 'Failed to fetch comment', error: error.message });
  }
};


exports.getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};


exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { content, isEdited: true },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};


exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};
