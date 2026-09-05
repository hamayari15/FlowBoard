
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSchema = new Schema({
  // Mirrors project-dialog.component.ts: Validators.required, minLength(2), maxLength(100)
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  // Mirrors project-dialog.component.ts: Validators.maxLength(500)
  description: { type: String, trim: true, maxlength: 500 },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
