const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'on-hold'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    dueDate: { type: Date },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: task count (populated separately)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Ensure owner is always in members as admin
projectSchema.pre('save', function (next) {
  const ownerExists = this.members.some(
    (m) => m.user.toString() === this.owner.toString()
  );
  if (!ownerExists) {
    this.members.push({ user: this.owner, role: 'admin' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
