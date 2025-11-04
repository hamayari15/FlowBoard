const mongoose = require('mongoose');
const { Schema } = mongoose;

const boardSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  columns: [{ 
    name: String, 
    order: Number,
    _id: false
  }],
  // Sprint-like functionality
  startDate: { type: Date },
  endDate: { type: Date },
  goal: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['planning', 'active', 'completed', 'archived'], 
    default: 'planning' 
  },
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;