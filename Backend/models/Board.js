const mongoose = require('mongoose');
const { Schema } = mongoose;

const boardSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  columns: [{ name: String, order: Number }],
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;