const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  status: { type: String, default: 'to-do' }, // Column ID where the task belongs
  position: { type: Number, default: 0 },
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  labels: [String],
  dueDate: Date,
  attachments: [{
    url: String,
    publicId: String
  }]
}, { timestamps: true });

// Prevent model overwrite error
module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
