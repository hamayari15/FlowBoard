const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  // Mirrors task-dialog.component.ts: Validators.required, minLength(3); maxlength(100) in the template
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  // Mirrors the template's maxlength(500) on the description textarea
  description: { type: String, trim: true, maxlength: 500 },
  board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  status: { type: String, enum: ['to-do', 'in-progress', 'in-review', 'done'], default: 'to-do' },
  position: { type: Number, default: 0 },
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  // The dialog's "labels" field is one comma-separated input capped at
  // maxlength(200) before being split into this array - mirror that as a
  // combined-length cap so the API can't be used to bypass it.
  labels: {
    type: [String],
    default: [],
    validate: {
      validator: (arr) => !arr || arr.join(', ').length <= 200,
      message: 'Labels must not exceed 200 characters combined'
    }
  },
  dueDate: Date,
  attachments: [{
    url: String,
    publicId: String
  }]
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;