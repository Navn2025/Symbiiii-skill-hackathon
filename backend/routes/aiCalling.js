import express from 'express';
import axios from 'axios';

const router = express.Router();

// AI Calling Python server URL (default localhost:8000)
const AI_CALLING_URL = process.env.AI_CALLING_URL || 'http://localhost:8000';

/* ═══════════════════════════════════════════════════════════════════
   AI CALLING ROUTES — Proxy to Python FastAPI server
   ═══════════════════════════════════════════════════════════════════ */

// Health check for AI Calling server
router.get('/health', async (req, res) => {
  try {
    const resp = await axios.get(`${AI_CALLING_URL}/`, { timeout: 5000 });
    return res.json({ status: 'online', server: resp.data });
  } catch (err) {
    return res.json({ status: 'offline', message: 'AI Calling server is not running' });
  }
});

// Get available demo candidates
router.get('/candidates', async (req, res) => {
  try {
    const resp = await axios.get(`${AI_CALLING_URL}/demos`, { timeout: 5000 });
    return res.json(resp.data);
  } catch (err) {
    // Return built-in demo candidates if server is offline
    return res.json({
      candidates: {
        backend_developer: {
          name: 'Ravi Kumar',
          position: 'Backend Developer',
          assessment_score: 78,
          priority_skills: ['Python', 'Django', 'REST APIs'],
          weak_areas: ['System Design', 'Microservices'],
        },
        frontend_developer: {
          name: 'Priya Sharma',
          position: 'Frontend Developer',
          assessment_score: 82,
          priority_skills: ['React', 'JavaScript', 'CSS'],
          weak_areas: ['Testing', 'Performance Optimization'],
        },
        fullstack_developer: {
          name: 'Amit Patel',
          position: 'Full Stack Developer',
          assessment_score: 75,
          priority_skills: ['Node.js', 'React', 'MongoDB'],
          weak_areas: ['DevOps', 'Security'],
        },
        data_analyst: {
          name: 'Sneha Reddy',
          position: 'Data Analyst',
          assessment_score: 85,
          priority_skills: ['Python', 'SQL', 'Tableau'],
          weak_areas: ['Machine Learning', 'Statistical Modeling'],
        },
      },
    });
  }
});

// Set active demo candidate
router.post('/set-candidate', async (req, res) => {
  try {
    const { candidateKey } = req.body;
    if (!candidateKey) {
      return res.status(400).json({ message: 'candidateKey is required' });
    }

    const resp = await axios.post(`${AI_CALLING_URL}/demo`, { candidate_key: candidateKey }, { timeout: 5000 });
    return res.json(resp.data);
  } catch (err) {
    console.error('[AI-CALLING] Set candidate error:', err.message);
    return res.status(500).json({ message: 'Failed to set candidate. Is the AI Calling server running?' });
  }
});

// Initiate a call via Twilio
router.post('/initiate-call', async (req, res) => {
  try {
    const { phoneNumber, candidateKey, ngrokUrl } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // First, set the active candidate if provided
    if (candidateKey) {
      try {
        await axios.post(`${AI_CALLING_URL}/demo`, { candidate_key: candidateKey }, { timeout: 5000 });
      } catch (e) {
        console.warn('[AI-CALLING] Could not set candidate:', e.message);
      }
    }

    // Use Twilio credentials from env
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const webhookUrl = ngrokUrl || process.env.NGROK_URL;

    if (!accountSid || !authToken || !twilioPhone) {
      return res.status(500).json({ message: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env' });
    }

    if (!webhookUrl) {
      return res.status(500).json({ message: 'NGROK_URL not configured. Start ngrok and set the URL in .env' });
    }

    // Make Twilio API call directly
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', twilioPhone);
    formData.append('Url', `${webhookUrl}/answer`);

    const twilioResp = await axios.post(twilioUrl, formData.toString(), {
      auth: { username: accountSid, password: authToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    console.log(`[AI-CALLING] ✅ Call initiated to ${phoneNumber}, SID: ${twilioResp.data.sid}`);

    return res.json({
      message: 'Call initiated successfully',
      callSid: twilioResp.data.sid,
      status: twilioResp.data.status,
      to: phoneNumber,
      from: twilioPhone,
    });
  } catch (err) {
    console.error('[AI-CALLING] Initiate call error:', err.response?.data || err.message);
    return res.status(500).json({
      message: `Failed to initiate call: ${err.response?.data?.message || err.message}`,
    });
  }
});

// Get call logs from the AI Calling server
router.get('/logs', async (req, res) => {
  try {
    const resp = await axios.get(`${AI_CALLING_URL}/logs`, { timeout: 5000 });
    return res.json(resp.data);
  } catch (err) {
    return res.json({ logs: [], message: 'AI Calling server is offline' });
  }
});

// Get call status via Twilio
router.get('/call-status/:callSid', async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return res.status(500).json({ message: 'Twilio credentials not configured' });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${req.params.callSid}.json`;
    const resp = await axios.get(twilioUrl, {
      auth: { username: accountSid, password: authToken },
      timeout: 10000,
    });

    return res.json({
      callSid: resp.data.sid,
      status: resp.data.status,
      duration: resp.data.duration,
      startTime: resp.data.start_time,
      endTime: resp.data.end_time,
      to: resp.data.to,
      from: resp.data.from,
    });
  } catch (err) {
    return res.status(500).json({ message: `Failed to get call status: ${err.message}` });
  }
});

export default router;
