import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import AIInterview from '../models/AIInterview.js';
import aiInterviewer from '../services/aiInterviewer.js';
import {
  runFullPipeline,
  generateAssessment,
  analyzeOverclaims,
  experienceGate,
} from '../services/verificationService.js';
import { parseResume, parseJD, analyzeGap } from '../services/resumeParser.js';

const router = express.Router();

// ─── Run full verification pipeline ────────────────────────
router.post('/:userId/run', async (req, res) => {
  try {
    const { userId } = req.params;
    const { jdText } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.resumeText) {
      return res.status(400).json({ error: 'No resume uploaded. Please upload your resume first.' });
    }

    const pipeline = runFullPipeline(user.resumeText, jdText || null);

    // Store verification data on user
    user.verification = {
      lastRunAt: new Date(),
      jdText: jdText || null,
      layer1: pipeline.layer1,
      layer2: pipeline.layer2,
      layer3: null,
      resumeParsed: pipeline.resumeResult,
      gapAnalysis: pipeline.gapAnalysis,
      pipelineComplete: false,
    };
    user.markModified('verification');
    await user.save();

    res.json({
      success: true,
      layer1: pipeline.layer1,
      layer2: pipeline.layer2,
      resumeParsed: pipeline.resumeResult,
      gapAnalysis: pipeline.gapAnalysis,
    });
  } catch (err) {
    console.error('Verification run error:', err);
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// ─── Get stored verification results ──────────────────────
router.get('/:userId/results', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      verification: user.verification || null,
      hasResume: !!user.resumeText,
    });
  } catch (err) {
    console.error('Verification results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ─── Layer 2: Get assessment questions ────────────────────
router.get('/:userId/assessment', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.verification?.layer2) {
      return res.status(400).json({
        error: 'Run verification first to generate assessment questions.',
      });
    }

    res.json({
      success: true,
      assessment: user.verification.layer2,
    });
  } catch (err) {
    console.error('Assessment fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// ─── Layer 2−3: Submit assessment answers & get overclaim analysis ──
router.post('/:userId/submit-assessment', async (req, res) => {
  try {
    const { userId } = req.params;
    const { answers } = req.body;
    // answers: [{ skill, score (0-100), type, questionId }]

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.resumeText) {
      return res.status(400).json({ error: 'No resume uploaded.' });
    }

    const resumeResult = user.verification?.resumeParsed || parseResume(user.resumeText);

    // Run Layer 3
    const layer3 = analyzeOverclaims(answers, resumeResult);

    // Update verification on user
    if (!user.verification) user.verification = {};
    user.verification.layer3 = layer3;
    user.verification.assessmentAnswers = answers;
    user.verification.pipelineComplete = true;
    user.verification.completedAt = new Date();
    user.markModified('verification');
    await user.save();

    res.json({
      success: true,
      layer3,
      pipelineComplete: true,
    });
  } catch (err) {
    console.error('Assessment submit error:', err);
    res.status(500).json({ error: 'Failed to analyze assessment', details: err.message });
  }
});

// ─── Quick experience check (Layer 1 only) ────────────────
router.post('/:userId/experience-check', async (req, res) => {
  try {
    const { userId } = req.params;
    const { jdText } = req.body;

    if (!jdText) return res.status(400).json({ error: 'Job description text required.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.resumeText) return res.status(400).json({ error: 'No resume uploaded.' });

    const resumeResult = parseResume(user.resumeText);
    const jdResult = parseJD(jdText);
    const layer1 = experienceGate(jdResult, resumeResult);

    res.json({ success: true, layer1 });
  } catch (err) {
    console.error('Experience check error:', err);
    res.status(500).json({ error: 'Experience check failed' });
  }
});

// ─── Quick skill gap analysis ─────────────────────────────
router.post('/:userId/skill-gap', async (req, res) => {
  try {
    const { userId } = req.params;
    const { jdText } = req.body;

    if (!jdText) return res.status(400).json({ error: 'Job description text required.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.resumeText) return res.status(400).json({ error: 'No resume uploaded.' });

    const resumeResult = parseResume(user.resumeText);
    const jdResult = parseJD(jdText);
    const gap = analyzeGap(jdResult, resumeResult);

    res.json({ success: true, gap });
  } catch (err) {
    console.error('Skill gap error:', err);
    res.status(500).json({ error: 'Skill gap analysis failed' });
  }
});

// ─── Auto-create AI Interview from verification data (Layer 2) ──
router.post('/:userId/auto-interview', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.verification?.layer2) {
      return res.status(400).json({ error: 'Run verification first to generate Layer 2 data.' });
    }

    // Gather skills from verification + profile
    const skillsTested = user.verification.layer2.skillsTested || [];
    const profileSkills = user.skills || [];
    const projects = user.projects || [];
    const resumeParsed = user.verification.resumeParsed || user.resumeParsed || {};

    // Build context-rich topics from skills + projects
    const topics = [...new Set([
      ...skillsTested,
      ...profileSkills.slice(0, 5),
      ...projects.map(p => p.name).filter(Boolean).slice(0, 3),
    ])].slice(0, 8);

    // Determine role from JD or profile
    const role = resumeParsed?.role?.title || user.desiredRole || 'Software Developer';
    const candidateName = user.fullName || user.username || 'Candidate';

    // Determine experience level
    const expYears = resumeParsed?.experience?.years || user.verification.layer1?.resumeYears || 0;
    let experience = 'entry';
    if (expYears >= 5) experience = 'senior';
    else if (expYears >= 2) experience = 'mid';

    const sessionId = uuidv4();
    const difficultyMap = { entry: 'Easy', mid: 'Mixed', senior: 'Hard' };
    const difficulty = difficultyMap[experience] || 'Mixed';

    // Generate 5 AI-powered questions based on skills & projects
    let questions;
    try {
      questions = await aiInterviewer.generateAIQuestions(role, 5, difficulty, topics);
    } catch (aiErr) {
      console.error('AI question gen failed, using fallback:', aiErr.message);
      questions = aiInterviewer.getQuestionsForRole(role, 5);
    }

    const greeting = aiInterviewer.generateGreeting(candidateName, role);

    await AIInterview.create({
      sessionId,
      candidateName,
      candidateId: userId,
      role,
      experience,
      topics,
      duration: 30,
      status: 'active',
      startTime: new Date(),
      currentQuestionIndex: 0,
      questions,
      questionAnswerPairs: [],
      greeting,
      totalQuestions: questions.length,
      useAI: true,
    });

    // Store interview reference in verification
    user.verification.autoInterview = {
      sessionId,
      role,
      topics,
      questionCount: questions.length,
      createdAt: new Date(),
    };
    user.markModified('verification');
    await user.save();

    console.log(`✅ Auto AI Interview created from verification: ${sessionId} — ${role} (${questions.length}Q)`);

    res.json({
      success: true,
      sessionId,
      role,
      topics,
      questionCount: questions.length,
      greeting,
      firstQuestion: questions[0]?.question,
    });
  } catch (err) {
    console.error('Auto-interview creation error:', err);
    res.status(500).json({ error: 'Failed to create AI interview', details: err.message });
  }
});

// ─── Reset verification ──────────────────────────────────
router.delete('/:userId/reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.verification = {};
    user.markModified('verification');
    await user.save();

    res.json({ success: true, message: 'Verification reset.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

export default router;
