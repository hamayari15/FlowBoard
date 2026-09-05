const mongoose = require('mongoose');
const { Schema } = mongoose;

const boardSchema = new Schema({
  // Mirrors board-dialog.component.ts: Validators.required, minLength(3), maxLength(100)
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  // Mirrors board-dialog.component.ts: Validators.maxLength(500)
  description: { type: String, trim: true, maxlength: 500 },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  columns: [{
    name: String,
    order: Number,
    _id: false
  }],
  // Sprint-like functionality
  startDate: { type: Date },
  endDate: { type: Date },
  // Mirrors board-dialog.component.ts: Validators.maxLength(500)
  goal: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'archived'],
    default: 'planning'
  },
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;