# 🚀 Quick Start Guide

## Installation Steps

### 1. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 2. Install Frontend Dependencies

```powershell
cd frontend
npm install
```

## Running the Application

### Terminal 1 - Start Backend

```powershell
cd backend
npm run dev
```

✅ Backend will run on `http://localhost:3001`

### Terminal 2 - Start Frontend

```powershell
cd frontend
npm run dev
```

✅ Frontend will run on `http://localhost:5173`

## Access the Application

Open your browser and navigate to: **http://localhost:5173**

## Usage Flow

### Option 1: Recruiter Interview Mode

1. Select "Recruiter Interview Mode" card
2. Enter Candidate Name
3. Enter Recruiter Name
4. Click "🚀 Start Interview"
5. You'll be redirected to the interview room with:
   - Video calling
   - Code editor
   - Proctoring monitor
   - Chat panel

### Option 2: Practice Mode

1. Select "Preparation Interview Mode" card
2. Enter your name
3. Click "💪 Start Practice"
4. Practice with AI interviewer
5. Get instant feedback

## Features Available

✅ Real-time video calling (WebRTC)
✅ Live code editor with syntax highlighting
✅ Code execution (mock - ready for Judge0 API)
✅ Multi-language support (JavaScript, Python, Java, C++)
✅ Chat functionality
✅ AI interviewer for practice mode
✅ Proctoring monitor with integrity scoring
✅ Question bank with 5+ coding questions

## Troubleshooting

### Backend not starting?

- Make sure port 3001 is not in use
- Check if all dependencies are installed
- Run `npm install` again

### Frontend not starting?

- Make sure port 5173 is not in use
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Video not working?

- Allow camera and microphone permissions in browser
- Make sure you're using HTTPS or localhost
- Try in Chrome/Edge (best WebRTC support)

### WebSocket connection issues?

- Make sure backend is running
- Check CORS settings in backend/.env
- Verify frontend is connecting to correct backend URL

## Optional: Add Real AI & Code Execution

### 1. Add OpenAI API Key (for AI features)

In `backend/.env`:

```
OPENAI_API_KEY=sk-your-key-here
```

### 2. Add Judge0 API (for code execution)

Sign up at https://rapidapi.com/judge0-official/api/judge0-ce

In `backend/.env`:

```
JUDGE0_API_KEY=your-rapidapi-key
```

## Project Structure

```
IIT/
├── backend/               # Express.js backend
│   ├── routes/           # API endpoints
│   │   ├── interview.js
│   │   ├── questions.js
│   │   ├── codeExecution.js
│   │   ├── proctoring.js
│   │   └── ai.js
│   ├── socket/           # WebSocket handlers
│   │   └── handlers.js
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env              # Environment variables
│
└── frontend/             # Vite React app
    ├── src/
    │   ├── components/   # Reusable components
    │   │   ├── CodeEditor.jsx
    │   │   ├── VideoPanel.jsx
    │   │   ├── ProctoringMonitor.jsx
    │   │   ├── ChatPanel.jsx
    │   │   └── QuestionPanel.jsx
    │   ├── pages/        # Main pages
    │   │   ├── Home.jsx
    │   │   ├── InterviewRoom.jsx
    │   │   └── PracticeMode.jsx
    │   ├── services/     # API services
    │   │   ├── api.js
    │   │   └── socket.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## Tech Stack

**Backend:**

- Node.js + Express.js
- Socket.IO (WebSockets)
- Axios

**Frontend:**

- React 18
- Vite
- React Router DOM
- Monaco Editor (VS Code editor)
- Socket.IO Client
- Simple-Peer (WebRTC)

## Demo Accounts (No Auth Required)

You can use any names - no authentication required!

Just enter:

- Candidate Name: John Doe
- Recruiter Name: Jane Smith (for recruiter mode)

## Next Steps for Hackathon

1. ✅ Test the application thoroughly
2. ⚠️ Add face detection library (MediaPipe or tracking.js)
3. ⚠️ Integrate real Judge0 API for code execution
4. ⚠️ Add OpenAI for better AI responses
5. ⚠️ Improve UI/UX polish
6. ⚠️ Add screen recording feature
7. ⚠️ Create impressive demo video

## Need Help?

Check the console logs in both:

- Browser DevTools (F12)
- Backend terminal

Most issues show up there!

---

**Your platform is ready to demo! 🎉**

Good luck with your hackathon! 🏆
