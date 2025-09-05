
const mongoose = require('mongoose');
const { Schema } = mongoose;

const workspaceSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
