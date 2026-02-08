# AI Interview Platform

Complete full-stack interview platform with AI features, real-time video, code execution, and proctoring.

## 🚀 Features

- **Dual Interview Modes**
  - Recruiter Interview Mode (Live interviews with proctoring)
  - Practice Mode (AI interviewer with instant feedback)

- **Real-time Communication**
  - WebRTC video conferencing
  - Socket.IO for real-time updates
  - Live code collaboration

- **Code Execution**
  - Multi-language support (JavaScript, Python, Java, C++)
  - Monaco Editor (VS Code engine)
  - Test case validation

- **AI Features**
  - AI interviewer for practice mode
  - Automated code evaluation
  - Instant feedback generation

- **Proctoring (Recruiter Mode)**
  - Face detection & tracking
  - Advanced eye tracking & gaze detection
  - **AI-generated answer detection**
  - **📱 Secondary camera (phone as side camera)**
  - Tab switch & window monitoring
  - Multiple person detection
  - Integrity scoring system
  - Real-time violation alerts

## 📁 Project Structure

```
IIT/
├── backend/          # Express.js backend
│   ├── routes/       # API routes
│   ├── socket/       # WebSocket handlers
│   └── server.js     # Entry point
├── frontend/         # Vite React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API & Socket services
│   │   └── main.jsx     # Entry point
│   └── package.json
└── HACKATHON_FEATURES.md
```

## 🛠️ Installation

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🌐 API Endpoints

### Interview

- `POST /api/interview/create` - Create new interview
- `GET /api/interview/:id` - Get interview details
- `POST /api/interview/:id/end` - End interview

### Questions

- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get specific question
- `GET /api/questions/random/:count` - Get random questions

### Code Execution

- `POST /api/code-execution/execute` - Execute code
- `POST /api/code-execution/submit` - Submit with test cases

### Proctoring

- `POST /api/proctoring/event` - Log proctoring event
- `GET /api/proctoring/:interviewId` - Get events
- `GET /api/proctoring/:interviewId/score` - Get integrity score

### AI

- `POST /api/ai/ask-question` - Generate AI question
- `POST /api/ai/evaluate-code` - AI code evaluation
- `POST /api/ai/interview-chat` - Chat with AI interviewer

## 🔌 WebSocket Events

### Client → Server

- `join-interview` - Join interview room
- `leave-interview` - Leave interview room
- `code-update` - Send code changes
- `chat-message` - Send chat message
- `webrtc-offer/answer/ice-candidate` - WebRTC signaling

### Server → Client

- `user-joined` - User joined notification
- `user-left` - User left notification
- `code-update` - Receive code changes
- `chat-message` - Receive chat message
- `proctoring-alert` - Proctoring event alert

## 🎯 Usage

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Open Browser**: Navigate to `http://localhost:5173`
4. **Choose Mode**: Select between Recruiter or Practice mode
5. **Start Interview**: Enter details and begin!

## 🔧 Environment Variables

Create `.env` in backend folder:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your-key-here
JUDGE0_API_KEY=your-key-here
```

## 📦 Tech Stack

### Backend

- Node.js + Express
- Socket.IO
- Axios

### Frontend

- React 18
- Vite
- React Router
- Monaco Editor
- Socket.IO Client
- Simple-Peer (WebRTC)

## 🚧 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User authentication
- Screen sharing
- Advanced face recognition
- Code playback feature
- Interview analytics dashboard
- Mobile responsive design

## � Documentation

- [**QUICKSTART.md**](QUICKSTART.md) - Quick setup guide
- [**HACKATHON_FEATURES.md**](HACKATHON_FEATURES.md) - Feature showcase
- [**PROCTORING_TEST_GUIDE.md**](PROCTORING_TEST_GUIDE.md) - Testing proctoring features
- [**AI_DETECTION.md**](AI_DETECTION.md) - AI-generated answer detection guide- [**SECONDARY_CAMERA.md**](SECONDARY_CAMERA.md) - Phone as secondary camera setup- [**SECURITY_SETUP.md**](SECURITY_SETUP.md) - Security configuration

## �📄 License

MIT License

## 👥 Contributing

Contributions welcome! Please open an issue or submit a PR.

---

Built with ❤️ for hackathons
