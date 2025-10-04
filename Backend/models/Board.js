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
}, { timestamps: true });

// Prevent model overwrite error
module.exports = mongoose.models.Board || mongoose.model('Board', boardSchema);