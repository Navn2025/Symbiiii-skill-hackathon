import dotenv from 'dotenv';
import {fileURLToPath} from 'url';
import path from 'path';

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

// Load environment variables FIRST before anything else
dotenv.config({path: path.join(__dirname, '.env')});

// Verify critical env vars
if (!process.env.GROQ_API_KEY)
{
    console.warn('⚠️  Warning: GROQ_API_KEY not found in .env file');
    console.warn('   Get your free API key from https://console.groq.com/keys');
} else
{
    console.log('✅ GROQ_API_KEY loaded successfully');
}

export default {
    PORT: process.env.PORT||5000,
    FRONTEND_URL: process.env.FRONTEND_URL||'http://localhost:5173',
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    // AI Calling (Twilio + Python server)
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
    NGROK_URL: process.env.NGROK_URL || '',
    AI_CALLING_URL: process.env.AI_CALLING_URL || 'http://localhost:8000',
};
