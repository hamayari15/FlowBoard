
const mongoose = require('mongoose');
const { Schema } = mongoose;

const workspaceSchema = new Schema({
  // Mirrors work-space-dialog.component.ts: Validators.required, minLength(2), maxLength(100)
  name: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 100 },
  // Mirrors work-space-dialog.component.ts: Validators.maxLength(500)
  description: { type: String, trim: true, maxlength: 500 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
