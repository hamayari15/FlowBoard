
const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  // Mirrors edit-comment-dialog.component.ts: Validators.required, minLength(3)
  content: { type: String, required: true, trim: true, minlength: 3 },
  task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
