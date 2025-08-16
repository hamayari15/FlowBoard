
const mongoose = require('mongoose');
const { Schema } = mongoose;


const commentSchema = new Schema({
  content: { type: String, required: true },
  task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
