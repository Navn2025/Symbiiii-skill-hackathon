import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'selected', 'screening', 'interview', 'assessment', 'offered', 'hired', 'rejected', 'withdrawn'],
    default: 'applied',
  },
  coverLetter: {
    type: String,
    default: '',
  },
  round: {
    type: String,
    default: 'Applied',
  },
  score: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
  },
  statusHistory: [{
    status: { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  }],
  appliedAt: { type: Date, default: Date.now },
  shortlistedAt: { type: Date },
  selectedAt: { type: Date },
}, {
  timestamps: true,
});

// Prevent duplicate applications
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
