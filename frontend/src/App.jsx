import {BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import InterviewRoom from './pages/InterviewRoom'
import PracticeMode from './pages/PracticeMode'
import SecondaryCameraView from './pages/SecondaryCameraView'
import ProctorDashboard from './pages/ProctorDashboard'
import PracticeSessionSetup from './pages/PracticeSessionSetup'
import PracticeInterviewRoom from './pages/PracticeInterviewRoom'
import PracticeFeedback from './pages/PracticeFeedback'
import AxiomChat from './pages/AxiomChat'
import AIInterviewSetup from './pages/AIInterviewSetup'
import AIInterviewRoom from './pages/AIInterviewRoom'
import AIInterviewReport from './pages/AIInterviewReport'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CodingPractice from './pages/CodingPractice'
import CandidateDashboard from './pages/CandidateDashboard'
import CompanyDashboard from './pages/CompanyDashboard'
import AdminScoring from './pages/AdminScoring'
import CandidateResults from './pages/CandidateResults'
import CandidateAnalytics from './pages/CandidateAnalytics'
import './App.css'

// Pages that render their own navbar (dashboards)
const HIDE_NAVBAR_PATHS = ['/candidate-dashboard', '/company-dashboard', '/admin-scoring', '/candidate-results', '/candidate-analytics'];

function AppLayout()
{
    const location = useLocation();
    const hideNavbar = location.pathname === '/' || HIDE_NAVBAR_PATHS.some(p => location.pathname.startsWith(p));

    return (
        <div className="App">
            {!hideNavbar && <Navbar />}
            <div className={!hideNavbar ? 'page-content' : ''}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/interview/:interviewId" element={<InterviewRoom />} />
                <Route path="/practice" element={<PracticeMode />} />
                <Route path="/practice-setup" element={<PracticeSessionSetup />} />
                <Route path="/practice-interview/:sessionId" element={<PracticeInterviewRoom />} />
                <Route path="/practice-feedback/:sessionId" element={<PracticeFeedback />} />
                <Route path="/secondary-camera" element={<SecondaryCameraView />} />
                <Route path="/proctor-dashboard" element={<ProctorDashboard />} />
                <Route path="/axiom-chat" element={<AxiomChat />} />
                <Route path="/ai-interview-setup" element={<AIInterviewSetup />} />
                <Route path="/ai-interview/:sessionId" element={<AIInterviewRoom />} />
                <Route path="/ai-interview-report/:sessionId" element={<AIInterviewReport />} />
                <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
                <Route path="/coding-practice" element={<CodingPractice />} />
                <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
                <Route path="/company-dashboard" element={<CompanyDashboard />} />
                <Route path="/admin-scoring" element={<AdminScoring />} />
                <Route path="/candidate-results" element={<CandidateResults />} />
                <Route path="/candidate-analytics" element={<CandidateAnalytics />} />
            </Routes>
            </div>
        </div>
    )
}

function App()
{
    return (
        <Router>
            <AppLayout />
        </Router>
    )
}

export default App
