import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { registerFace, verifyFace, checkFaceExists } from '../services/faceService.js';

const router = express.Router();

// ── Mail transporter ────────────────────────────────────────────────
let transporter = null;
try {
  if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_SERVER || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
    console.log('[AUTH] ✅ Mail transporter configured for', process.env.MAIL_USERNAME);
  }
} catch (e) {
  console.log('[AUTH] Mail transporter not configured, OTPs will be logged to console');
}

// ── Helpers ─────────────────────────────────────────────────────────
function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verify;
}

// ── Send OTP ────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const purpose = req.body.purpose || 'register';

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (purpose === 'register') {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    if (purpose === 'forgot_password') {
      const existing = await User.findOne({ email });
      if (!existing) {
        return res.status(404).json({ message: 'No account found with this email' });
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert OTP (replace any existing OTP for same email+purpose)
    await Otp.findOneAndUpdate(
      { email, purpose },
      { otp, expiresAt, used: false },
      { upsert: true, new: true }
    );

    // Try to send email
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.MAIL_USERNAME,
          to: email,
          subject: purpose === 'register' ? 'Your Registration OTP – HireSpec' : 'Password Reset OTP – HireSpec',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 30px; background: #0a0a0a; color: #fff; border-radius: 12px;">
              <h2 style="text-align: center; color: #fff;">🛡️ HireSpec</h2>
              <p style="text-align: center; color: #a3a3a3;">Your verification code</p>
              <div style="text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 6px; padding: 20px; background: #1a1a1a; border-radius: 8px; margin: 20px 0;">${otp}</div>
              <p style="text-align: center; color: #737373; font-size: 12px;">This code expires in 10 minutes</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.log(`[AUTH] Mail send failed: ${mailErr.message}`);
        console.log(`[AUTH] OTP for ${email}: ${otp}`);
      }
    } else {
      console.log(`[AUTH] 📧 OTP for ${email} (${purpose}): ${otp}`);
    }

    return res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[AUTH] send-otp error:', err);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Verify OTP ──────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = req.body.otp || '';
    const purpose = req.body.purpose || 'register';

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const stored = await Otp.findOne({ email, purpose, used: false });

    if (!stored) {
      return res.status(400).json({ message: 'Invalid or expired OTP', verified: false });
    }

    if (new Date() > stored.expiresAt) {
      await Otp.deleteOne({ _id: stored._id });
      return res.status(400).json({ message: 'OTP has expired', verified: false });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP', verified: false });
    }

    stored.used = true;
    await stored.save();
    return res.json({ message: 'OTP verified', verified: true });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Register (with face descriptors) ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email: rawEmail, password, confirmPassword, descriptors, role: rawRole, companyName } = req.body;
    const email = (rawEmail || '').trim().toLowerCase();
    const role = ['candidate', 'company_admin', 'company_hr', 'recruiter', 'proctor'].includes(rawRole) ? rawRole : 'candidate';

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!descriptors || descriptors.length < 3) {
      return res.status(400).json({ message: 'Please provide at least 3 face descriptors' });
    }

    // Check uniqueness in MongoDB
    const existingUser = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email }] });
    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Check if face already exists in Pinecone
    try {
      const { exists, userId: existingFaceUser } = await checkFaceExists(descriptors[0]);
      if (exists) {
        console.log(`[AUTH] Face already registered to: ${existingFaceUser}`);
        return res.status(409).json({ message: 'This face is already registered' });
      }
    } catch (faceCheckErr) {
      console.log(`[AUTH] Face duplicate check skipped: ${faceCheckErr.message}`);
    }

    // Register face descriptors in Pinecone
    const { result: faceResult, error: faceError } = await registerFace(username.toLowerCase(), descriptors);
    if (faceError) {
      console.error(`[AUTH] Face registration failed: ${faceError}`);
    }

    // Create user in MongoDB
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password: hashPassword(password),
      role,
      companyName: companyName || '',
      faceRegistered: !!faceResult,
    });

    console.log(`[AUTH] ✅ User registered: ${username} (${role}) with ${descriptors.length} face descriptors | Pinecone: ${faceResult ? 'stored' : 'skipped'}`);

    return res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      faceRegistered: user.faceRegistered,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('[AUTH] register error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Login (password) ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(401).json({ message: 'Missing credentials' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    console.log(`[AUTH] ✅ Login successful: ${username}`);
    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Face Login ──────────────────────────────────────────────────────
router.post('/face-login', async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(401).json({ message: 'No face descriptor provided' });
    }

    // Verify face against Pinecone
    const { result: faceMatch, error: faceError } = await verifyFace(descriptor);

    if (faceError || !faceMatch) {
      console.log(`[AUTH] 🔍 Face login failed: ${faceError || 'No match'}`);
      return res.status(401).json({ message: faceError || 'No matching face found. Please register first.' });
    }

    const matchedUsername = faceMatch.user_id;
    const matchScore = faceMatch.score;

    // Look up user in MongoDB
    const user = await User.findOne({ username: matchedUsername });
    if (!user) {
      console.log(`[AUTH] 🔍 Face matched ${matchedUsername} (score: ${matchScore.toFixed(3)}) but user not found in DB`);
      return res.status(401).json({ message: 'Face recognized but user account not found. You may need to register again.' });
    }

    console.log(`[AUTH] 🔍 Face login successful: ${matchedUsername} (score: ${matchScore.toFixed(3)})`);
    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      faceScore: matchScore,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('[AUTH] face-login error:', err);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Forgot Password ─────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email, purpose: 'forgot_password' },
      { otp, expiresAt, used: false },
      { upsert: true, new: true }
    );

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.MAIL_USERNAME,
          to: email,
          subject: 'Password Reset OTP – HireSpec',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 30px; background: #0a0a0a; color: #fff; border-radius: 12px;">
              <h2 style="text-align: center;">🔑 Password Reset</h2>
              <div style="text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 6px; padding: 20px; background: #1a1a1a; border-radius: 8px; margin: 20px 0;">${otp}</div>
              <p style="text-align: center; color: #737373;">Expires in 10 minutes</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.log(`[AUTH] Mail send failed, OTP: ${otp}`);
      }
    } else {
      console.log(`[AUTH] 📧 Reset OTP for ${email}: ${otp}`);
    }

    return res.json({ message: 'Reset OTP sent to your email' });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Reset Password ──────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password, confirmPassword } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = hashPassword(password);
    await user.save();

    console.log(`[AUTH] 🔑 Password reset for ${email}`);
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── Get current user ────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.json(null);

    const user = await User.findById(userId).select('-password');
    if (!user) return res.json(null);

    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      faceRegistered: user.faceRegistered,
      createdAt: user.createdAt,
    });
  } catch {
    return res.json(null);
  }
});

// ── Seed Demo Accounts ──────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    username: 'demo_student',
    email: 'student@hirespec.demo',
    password: 'demo123',
    role: 'candidate',
    companyName: '',
    bio: 'Computer Science student passionate about full-stack development.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
    profileComplete: 85,
  },
  {
    username: 'demo_company',
    email: 'company@hirespec.demo',
    password: 'demo123',
    role: 'company_admin',
    companyName: 'TechCorp Solutions',
    bio: 'Leading tech company specializing in AI and cloud solutions.',
    skills: [],
    profileComplete: 90,
  },
  {
    username: 'demo_recruiter',
    email: 'recruiter@hirespec.demo',
    password: 'demo123',
    role: 'recruiter',
    companyName: 'TechCorp Solutions',
    bio: 'Senior Technical Recruiter at TechCorp Solutions.',
    skills: [],
    profileComplete: 80,
  },
];

router.post('/seed-demo', async (req, res) => {
  try {
    const results = [];

    for (const acct of DEMO_ACCOUNTS) {
      const existing = await User.findOne({ username: acct.username });
      if (existing) {
        results.push({ username: acct.username, status: 'already exists', role: acct.role });
        continue;
      }

      const user = await User.create({
        username: acct.username,
        email: acct.email,
        password: hashPassword(acct.password),
        role: acct.role,
        companyName: acct.companyName,
        faceRegistered: false,
        bio: acct.bio,
        skills: acct.skills,
        profileComplete: acct.profileComplete,
      });

      results.push({ username: user.username, status: 'created', role: user.role });
      console.log(`[AUTH] ✅ Demo account created: ${user.username} (${user.role})`);
    }

    return res.json({ message: 'Demo accounts ready', accounts: results });
  } catch (err) {
    console.error('[AUTH] seed-demo error:', err);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// GET demo accounts info (no passwords)
router.get('/demo-accounts', (req, res) => {
  res.json({
    accounts: DEMO_ACCOUNTS.map(a => ({
      username: a.username,
      password: a.password,
      role: a.role,
      companyName: a.companyName,
      label: a.role === 'candidate' ? '🎓 Student' : a.role === 'company_admin' ? '🏢 Company Admin' : '👤 Recruiter',
    })),
  });
});

export default router;
