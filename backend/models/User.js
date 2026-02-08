import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['candidate', 'company_admin', 'company_hr', 'recruiter', 'proctor'],
    default: 'candidate',
  },
  companyName: {
    type: String,
    default: '',
  },
  faceRegistered: {
    type: Boolean,
    default: false,
  },
  skills: [{
    type: String,
  }],
  bio: {
    type: String,
    default: '',
  },
  profileComplete: {
    type: Number,
    default: 50,
  },
}, {
  timestamps: true,
});

// Indexes (role only - email/username already indexed via unique: true)
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
