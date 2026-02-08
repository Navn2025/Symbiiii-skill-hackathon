import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase, Eye, TrendingUp, Star, Search, Bell, LogOut,
  Dumbbell, Code, Bot, Shield, FileText, ChevronRight,
  BookOpen, Target, Award, Clock, MapPin, Building2, Users,
  BarChart3, ChevronDown, Send, Trash2, Play, Upload,
  Video, UserCheck, CheckCircle, XCircle, ExternalLink, Trophy
} from 'lucide-react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import './CandidateDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ═══════════════════════════════════════════════════════════════════
   TAB DEFINITIONS
   ═══════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
  { key: 'recruiter', label: 'Recruiter Interview', icon: <Video size={16} /> },
  { key: 'practice', label: 'Practice', icon: <Dumbbell size={16} /> },
  { key: 'coding', label: 'Coding Practice', icon: <Code size={16} /> },
  { key: 'ai-interview', label: 'AI Interview', icon: <Bot size={16} /> },
  { key: 'axiom', label: 'Spec AI', icon: <BookOpen size={16} /> },
];

function CandidateDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('practiceSession');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  if (!user) return null;
  const initials = (user.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="cd-page">
      {/* ═══ Dashboard Navbar ═══ */}
      <nav className="cd-navbar">
        <div className="cd-navbar-inner">
          <Link to="/candidate-dashboard" className="cd-logo">HireSpec</Link>
          <div className="cd-nav-links">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`cd-nav-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="cd-nav-right">
            <div className="cd-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search jobs, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="cd-icon-btn" title="Notifications"><Bell size={18} /></button>
            <button className="cd-icon-btn" title="Logout" onClick={handleLogout}><LogOut size={18} /></button>
            <div className="cd-avatar" title={user.username}>{initials}</div>
          </div>
        </div>
      </nav>

      {/* ═══ Tab Content ═══ */}
      <main className="cd-main">
        {activeTab === 'dashboard' && <DashboardTab user={user} initials={initials} setActiveTab={setActiveTab} />}
        {activeTab === 'recruiter' && <RecruiterInterviewTab user={user} />}
        {activeTab === 'practice' && <PracticeTab user={user} />}
        {activeTab === 'coding' && <CodingTab />}
        {activeTab === 'ai-interview' && <AIInterviewTab user={user} />}
        {activeTab === 'axiom' && <AxiomTab user={user} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD TAB (home overview)
   ═══════════════════════════════════════════════════════════════════ */
function DashboardTab({ user, initials, setActiveTab }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ applied: 0, assessments: 0, pending: 0, availableJobs: 0 });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes, appsRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs/stats/${user.id}`).catch(() => ({ data: { applied: 0, assessments: 0, pending: 0, availableJobs: 0 } })),
        axios.get(`${API_URL}/api/jobs/browse`).catch(() => ({ data: { jobs: [] } })),
        axios.get(`${API_URL}/api/jobs/applications/${user.id}`).catch(() => ({ data: { applications: [] } })),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data.jobs || []);
      setApplications(appsRes.data.applications || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post(`${API_URL}/api/jobs/${jobId}/apply`, { candidateId: user.id });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    }
  };

  const appliedJobIds = new Set(applications.map(a => a.job?.id));

  const statCards = [
    { label: 'APPLIED', value: String(stats.applied), icon: <Briefcase size={20} />, color: '#3b82f6' },
    { label: 'ASSESSMENTS', value: String(stats.assessments), icon: <Eye size={20} />, color: '#a855f7' },
    { label: 'PENDING', value: String(stats.pending), icon: <TrendingUp size={20} />, color: '#14b8a6' },
    { label: 'AVAILABLE', value: String(stats.availableJobs), icon: <Star size={20} />, color: '#eab308' },
  ];

  const quickActions = [
    { label: 'Recruiter Interview', desc: 'Join live interview with recruiter', icon: <Video size={22} />, tab: 'recruiter', badge: 'LIVE' },
    { label: 'Practice Interview', desc: 'AI interviewer with instant feedback', icon: <Dumbbell size={22} />, tab: 'practice', badge: 'PRACTICE' },
    { label: 'Coding Practice', desc: 'LeetCode-style problems with hints', icon: <Code size={22} />, tab: 'coding', badge: 'DSA' },
    { label: 'AI Interview', desc: 'Full AI-powered mock interview', icon: <Bot size={22} />, tab: 'ai-interview', badge: 'AI' },
    { label: 'Spec AI', desc: 'AI assistant for interview prep', icon: <BookOpen size={22} />, tab: 'axiom', badge: 'CHAT' },
    { label: 'My Results', desc: 'Scores, rankings & leaderboard', icon: <Trophy size={22} />, tab: 'results', badge: 'SCORES', link: '/candidate-results' },
    { label: 'Analytics', desc: 'Deep visual analytics & insights', icon: <BarChart3 size={22} />, tab: 'analytics', badge: 'NEW', link: '/candidate-analytics' },
  ];

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <div className="cd-container">
      <div className="cd-welcome">
        <h1>Welcome back, {user.username}!</h1>
        <p>Here's what's happening with your job search today</p>
      </div>

      <div className="cd-stats-row">
        {statCards.map((s) => (
          <div className="cd-stat-card" key={s.label}>
            <div className="cd-stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <div className="cd-stat-info">
              <span className="cd-stat-label">{s.label}</span>
              <span className="cd-stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="cd-grid">
        {/* Profile Card */}
        <div className="cd-card cd-profile-card">
          <div className="cd-profile-banner">
            <div className="cd-profile-avatar">{initials}</div>
          </div>
          <div className="cd-profile-body">
            <h3>{user.username}</h3>
            <span className="cd-role-badge">{user.role === 'candidate' ? 'Candidate' : user.role}</span>
            <div className="cd-profile-stats">
              <div><strong>{stats.applied}</strong><span>APPLIED</span></div>
              <div><strong>{stats.assessments}</strong><span>TESTS</span></div>
              <div><strong>{stats.availableJobs}</strong><span>AVAILABLE</span></div>
            </div>
            <div className="cd-progress-section">
              <div className="cd-progress-header">
                <span>Profile Completion</span><span>50%</span>
              </div>
              <div className="cd-progress-bar">
                <div className="cd-progress-fill" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="cd-card">
          <div className="cd-card-header">
            <h3><Target size={18} /> Recommended Jobs</h3>
            <span className="cd-badge">{jobs.length} available</span>
          </div>
          {loadingJobs ? (
            <div className="cd-empty-state"><p>Loading jobs...</p></div>
          ) : jobs.length === 0 ? (
            <div className="cd-empty-state">
              <Briefcase size={40} /><h4>No jobs found</h4><p>Try adjusting your search or check back later</p>
            </div>
          ) : (
            <div className="cd-jobs-list">
              {jobs.slice(0, 5).map(job => (
                <div className="cd-job-item" key={job.id}>
                  <div className="cd-job-info">
                    <strong>{job.title}</strong>
                    <span className="cd-job-meta">
                      <Building2 size={12} /> {job.companyName} · <MapPin size={12} /> {job.location} · <Clock size={12} /> {timeAgo(job.createdAt)}
                    </span>
                  </div>
                  <div className="cd-job-actions">
                    <span className="cd-job-type-badge">{job.type}</span>
                    {appliedJobIds.has(job.id) ? (
                      <span className="cd-applied-badge"><CheckCircle size={14} /> Applied</span>
                    ) : (
                      <button className="cd-apply-btn" onClick={() => handleApply(job.id)}>Apply</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cd-card">
          <div className="cd-card-header">
            <h3><FileText size={18} /> My Applications</h3>
          </div>
          {applications.length === 0 ? (
            <div className="cd-empty-state">
              <FileText size={40} /><h4>No applications</h4><p>Apply to jobs to track your progress</p>
            </div>
          ) : (
            <div className="cd-apps-list">
              {applications.slice(0, 5).map(app => (
                <div className="cd-app-item" key={app.id}>
                  <div className="cd-app-info">
                    <strong>{app.job?.title || 'Unknown Job'}</strong>
                    <span>{app.job?.companyName} · {app.job?.location}</span>
                  </div>
                  <span className={`cd-app-status ${app.status}`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cd-section">
        <div className="cd-card-header" style={{ marginBottom: 20 }}>
          <h3><Award size={18} /> Quick Actions</h3>
        </div>
        <div className="cd-actions-grid">
          {quickActions.map((action) => (
            <div className="cd-action-card" key={action.label} onClick={() => action.link ? navigate(action.link) : setActiveTab(action.tab)}>
              <div className="cd-action-top">
                <div className="cd-action-icon">{action.icon}</div>
                <span className="cd-action-badge">{action.badge}</span>
              </div>
              <h4>{action.label}</h4>
              <p>{action.desc}</p>
              <ChevronRight size={16} className="cd-action-arrow" />
            </div>
          ))}
        </div>
      </div>

      <div className="cd-section">
        <div className="cd-card">
          <div className="cd-card-header">
            <h3><BookOpen size={18} /> My Assessments</h3>
            <span className="cd-badge">0 total</span>
          </div>
          <div className="cd-empty-state">
            <Shield size={40} /><h4>No assessments yet</h4><p>When companies assign assessments, they'll appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RECRUITER INTERVIEW TAB
   ═══════════════════════════════════════════════════════════════════ */
function RecruiterInterviewTab({ user }) {
  const navigate = useNavigate();
  const [interviewCode, setInterviewCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoinInterview = () => {
    if (!interviewCode.trim()) return alert('Please enter an interview code');
    setJoinLoading(true);
    navigate(`/interview/${interviewCode.trim()}?mode=candidate&name=${encodeURIComponent(user.username)}&role=candidate`);
  };

  const handleQuickJoin = () => {
    const code = `interview-${Date.now()}`;
    navigate(`/interview/${code}?mode=candidate&name=${encodeURIComponent(user.username)}&role=candidate`);
  };

  const tips = [
    { icon: '🎯', title: 'Be Prepared', desc: 'Review the job description and company background before the interview' },
    { icon: '💡', title: 'Test Your Setup', desc: 'Check camera, microphone and internet connection before joining' },
    { icon: '📝', title: 'Have Notes Ready', desc: 'Keep a pen and paper handy for any notes during the interview' },
    { icon: '🕐', title: 'Join Early', desc: 'Try to join the interview 2-3 minutes before the scheduled time' },
  ];

  const features = [
    { icon: <Video size={24} />, title: 'Video Interview', desc: 'Face-to-face video call with your recruiter', color: '#3b82f6' },
    { icon: <Code size={24} />, title: 'Live Code Editor', desc: 'Collaborative code editor for technical rounds', color: '#a855f7' },
    { icon: <Shield size={24} />, title: 'AI Proctoring', desc: 'Secure & monitored interview environment', color: '#14b8a6' },
    { icon: <FileText size={24} />, title: 'Real-time Chat', desc: 'Text chat alongside video for sharing links', color: '#eab308' },
  ];

  return (
    <div className="cd-container cd-tab-content">
      <div className="cd-welcome">
        <h1>Recruiter Interview</h1>
        <p>Join a live interview session with your recruiter</p>
      </div>

      {/* Join Interview Card */}
      <div className="cdt-ri-join-card">
        <div className="cdt-ri-join-left">
          <div className="cdt-ri-join-icon"><Video size={40} /></div>
          <div>
            <h2>Join Interview Session</h2>
            <p>Enter the interview code provided by your recruiter to join the session</p>
          </div>
        </div>
        <div className="cdt-ri-join-form">
          <input
            type="text"
            placeholder="Enter interview code (e.g., INT-2024-001)"
            value={interviewCode}
            onChange={(e) => setInterviewCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinInterview()}
            className="cdt-ri-input"
          />
          <button className="cdt-ri-join-btn" onClick={handleJoinInterview} disabled={joinLoading}>
            {joinLoading ? 'Joining...' : '🚀 Join Interview'}
          </button>
        </div>
        <div className="cdt-ri-divider"><span>or</span></div>
        <button className="cdt-ri-quick-btn" onClick={handleQuickJoin}>
          <ExternalLink size={16} /> Quick Join (Demo Session)
        </button>
      </div>

      {/* Features Grid */}
      <div className="cdt-section">
        <h2>Interview Features</h2>
        <div className="cdt-ri-features-grid">
          {features.map((f, i) => (
            <div className="cdt-ri-feature-card" key={i}>
              <div className="cdt-ri-feature-icon" style={{ color: f.color, background: `${f.color}15` }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="cdt-section">
        <h2>Interview Tips</h2>
        <div className="cdt-ri-tips-grid">
          {tips.map((tip, i) => (
            <div className="cdt-ri-tip-card" key={i}>
              <span className="cdt-ri-tip-icon">{tip.icon}</span>
              <div>
                <h4>{tip.title}</h4>
                <p>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRACTICE TAB  (PracticeSessionSetup embedded)
   ═══════════════════════════════════════════════════════════════════ */
function PracticeTab({ user }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    role: '', difficulty: 'medium', interviewType: 'technical', mode: 'quick', duration: 20,
  });

  const roles = [
    { id: 'frontend', name: 'Frontend Developer', icon: '🎨' },
    { id: 'backend', name: 'Backend Developer', icon: '⚙️' },
    { id: 'fullstack', name: 'Full Stack Developer', icon: '🚀' },
    { id: 'data-science', name: 'Data Scientist', icon: '📊' },
    { id: 'devops', name: 'DevOps Engineer', icon: '🔧' },
    { id: 'mobile', name: 'Mobile Developer', icon: '📱' },
  ];

  const interviewTypes = [
    { id: 'technical', name: 'Technical Interview', desc: 'Technical concepts and problem solving', icon: '💻' },
    { id: 'behavioral', name: 'Behavioral Interview', desc: 'Behavioral questions and soft skills', icon: '💬' },
    { id: 'coding', name: 'Coding Round', desc: 'Live coding challenges', icon: '⌨️' },
    { id: 'system-design', name: 'System Design', desc: 'Architecture and design discussions', icon: '🏗️' },
  ];

  const modes = [
    { id: 'quick', name: 'Quick Practice', desc: '5 questions, 10-15 min', duration: 15, icon: '⚡',
      features: ['Fast feedback', 'No strict scoring', 'Basic evaluation'] },
    { id: 'real', name: 'Real Interview Simulation', desc: '10-15 questions, 30-40 min', duration: 35, icon: '🎯',
      features: ['Timed session', 'Adaptive difficulty', 'Detailed scorecard', 'Follow-up questions'] },
    { id: 'coding', name: 'Coding Challenge', desc: '2-3 problems, 45-60 min', duration: 50, icon: '👨‍💻',
      features: ['Code editor', 'Run & test', 'Time complexity analysis', 'Code quality review'] },
  ];

  const handleStart = () => {
    if (!config.role) return alert('Please select a role');
    const sessionId = `practice-${Date.now()}`;
    localStorage.setItem('practiceSession', JSON.stringify({ ...config, sessionId, startTime: new Date().toISOString() }));
    navigate(`/practice-interview/${sessionId}?role=${config.role}&difficulty=${config.difficulty}&type=${config.interviewType}&mode=${config.mode}`);
  };

  return (
    <div className="cd-container cd-tab-content">
      <div className="cd-welcome"><h1>AI Interview Practice</h1><p>Practice with AI-powered interviews tailored to your needs</p></div>

      <div className="cdt-section">
        <h2>1. Select Your Target Role</h2>
        <div className="cdt-role-grid">
          {roles.map(r => (
            <div key={r.id} className={`cdt-role-card ${config.role === r.id ? 'selected' : ''}`} onClick={() => setConfig({ ...config, role: r.id })}>
              <span className="cdt-role-icon">{r.icon}</span>
              <span className="cdt-role-name">{r.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cdt-section">
        <h2>2. Choose Interview Type</h2>
        <div className="cdt-type-grid">
          {interviewTypes.map(t => (
            <div key={t.id} className={`cdt-type-card ${config.interviewType === t.id ? 'selected' : ''}`} onClick={() => setConfig({ ...config, interviewType: t.id })}>
              <span className="cdt-type-icon">{t.icon}</span>
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="cdt-section">
        <h2>3. Select Difficulty Level</h2>
        <div className="cdt-diff-grid">
          {['easy', 'medium', 'hard'].map(d => (
            <button key={d} className={`cdt-diff-btn ${d} ${config.difficulty === d ? 'selected' : ''}`} onClick={() => setConfig({ ...config, difficulty: d })}>
              <span className="cdt-diff-emoji">{d === 'easy' ? '😊' : d === 'medium' ? '😐' : '😤'}</span>
              <strong>{d.charAt(0).toUpperCase() + d.slice(1)}</strong>
              <span>{d === 'easy' ? 'Entry level' : d === 'medium' ? 'Intermediate' : 'Advanced'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cdt-section">
        <h2>4. Choose Practice Mode</h2>
        <div className="cdt-mode-grid">
          {modes.map(m => (
            <div key={m.id} className={`cdt-mode-card ${config.mode === m.id ? 'selected' : ''}`} onClick={() => setConfig({ ...config, mode: m.id, duration: m.duration })}>
              <span className="cdt-mode-icon">{m.icon}</span>
              <h3>{m.name}</h3>
              <p>{m.desc}</p>
              <ul>{m.features.map((f, i) => <li key={i}>✓ {f}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      <div className="cdt-summary">
        <h3>Session Summary</h3>
        <div className="cdt-summary-items">
          <div><strong>Role</strong><span>{roles.find(r => r.id === config.role)?.name || 'Not selected'}</span></div>
          <div><strong>Type</strong><span>{interviewTypes.find(t => t.id === config.interviewType)?.name}</span></div>
          <div><strong>Difficulty</strong><span className={`cdt-badge-${config.difficulty}`}>{config.difficulty}</span></div>
          <div><strong>Mode</strong><span>{modes.find(m => m.id === config.mode)?.name}</span></div>
          <div><strong>Duration</strong><span>~{config.duration} min</span></div>
        </div>
        <button className="cdt-start-btn" onClick={handleStart} disabled={!config.role}>🚀 Start Practice Interview</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CODING PRACTICE TAB
   ═══════════════════════════════════════════════════════════════════ */
function CodingTab() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/coding-practice/questions`);
      const qs = res.data.questions || [];
      setQuestions(qs);
      if (qs.length) selectQuestion(qs[0]);
    } catch {
      const mock = [{ id: 1, title: 'Two Sum', difficulty: 'Easy', description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.', exampleInput: '[2, 7, 11, 15], target = 9', exampleOutput: '[0, 1]', testCases: [] }];
      setQuestions(mock);
      selectQuestion(mock[0]);
    }
  };

  const getStarter = (q, lang) => {
    const s = {
      javascript: `// ${q.title}\nfunction solution() {\n  // Write your code here\n}\nsolution();`,
      python: `# ${q.title}\ndef solution():\n    pass\nsolution()`,
      java: `// ${q.title}\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}`
    };
    return s[lang] || s.javascript;
  };

  const selectQuestion = (q) => { setSelectedQuestion(q); setCode(getStarter(q, language)); setOutput(''); setTestResults(null); };

  const handleRun = async () => {
    setLoading(true); setOutput('Running...');
    try {
      const res = await axios.post(`${API_URL}/api/coding-practice/run`, { code, language, questionId: selectedQuestion.id });
      setOutput(res.data.output || 'Executed successfully'); setTestResults(res.data.testResults);
    } catch (e) { setOutput('Error: ' + (e.response?.data?.error || 'Failed')); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/coding-practice/submit`, { code, language, questionId: selectedQuestion.id });
      setTestResults(res.data.testResults);
      setOutput(res.data.allPassed ? '✅ All test cases passed!' : '❌ Some test cases failed.');
    } catch (e) { setOutput('Error: ' + (e.response?.data?.error || 'Failed')); }
    finally { setLoading(false); }
  };

  return (
    <div className="cdt-coding-layout">
      {/* Sidebar */}
      <div className="cdt-coding-sidebar">
        <h3>Problems</h3>
        {questions.map(q => (
          <div key={q.id} className={`cdt-q-item ${selectedQuestion?.id === q.id ? 'active' : ''}`} onClick={() => selectQuestion(q)}>
            <span className="cdt-q-title">{q.title}</span>
            <span className={`cdt-q-diff ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="cdt-coding-main">
        {selectedQuestion && (
          <>
            <div className="cdt-q-details">
              <h2>{selectedQuestion.title} <span className={`cdt-q-diff-badge ${selectedQuestion.difficulty.toLowerCase()}`}>{selectedQuestion.difficulty}</span></h2>
              <p>{selectedQuestion.description}</p>
              <div className="cdt-q-example">
                <h4>Example:</h4>
                <div className="cdt-q-example-box">
                  <div><strong>Input:</strong> {selectedQuestion.exampleInput}</div>
                  <div><strong>Output:</strong> {selectedQuestion.exampleOutput}</div>
                </div>
              </div>
            </div>

            <div className="cdt-code-section">
              <div className="cdt-code-header">
                <select value={language} onChange={(e) => { setLanguage(e.target.value); setCode(getStarter(selectedQuestion, e.target.value)); }}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
                <div className="cdt-code-actions">
                  <button onClick={handleRun} disabled={loading}><Play size={14} /> {loading ? 'Running...' : 'Run'}</button>
                  <button className="cdt-submit-btn" onClick={handleSubmit} disabled={loading}><Upload size={14} /> Submit</button>
                </div>
              </div>
              <CodeEditor code={code} setCode={setCode} language={language} />
              <div className="cdt-output">
                <h4>Output:</h4>
                <pre>{output || 'Run your code to see results...'}</pre>
                {testResults && (
                  <div className="cdt-test-results">
                    {testResults.map((r, i) => (
                      <div key={i} className={`cdt-test-case ${r.passed ? 'passed' : 'failed'}`}>
                        Test {i + 1}: {r.passed ? '✅ Passed' : '❌ Failed'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AI INTERVIEW TAB
   ═══════════════════════════════════════════════════════════════════ */
function AIInterviewTab({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    candidateName: user?.username || '', role: '', experience: 'entry', topics: [], duration: 30
  });
  const [loading, setLoading] = useState(false);

  const availableTopics = ['JavaScript', 'React', 'Node.js', 'Python', 'Data Structures', 'Algorithms', 'System Design', 'Databases', 'APIs', 'Web Development'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topics.length) return alert('Select at least one topic');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/ai-interview/create`, formData);
      navigate(`/ai-interview/${res.data.sessionId}`);
    } catch { alert('Failed to create interview session'); setLoading(false); }
  };

  return (
    <div className="cd-container cd-tab-content">
      <div className="cd-welcome"><h1>AI Interview Setup</h1><p>Configure your AI-powered interview session</p></div>

      <div className="cdt-ai-card">
        <form onSubmit={handleSubmit}>
          <div className="cdt-form-group">
            <label>Your Name</label>
            <input value={formData.candidateName} onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })} placeholder="Enter your name" required />
          </div>
          <div className="cdt-form-group">
            <label>Target Role</label>
            <input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="e.g., Frontend Developer" required />
          </div>
          <div className="cdt-form-group">
            <label>Experience Level</label>
            <select value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })}>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (5+ years)</option>
            </select>
          </div>
          <div className="cdt-form-group">
            <label>Select Topics</label>
            <div className="cdt-topics-grid">
              {availableTopics.map(t => (
                <button key={t} type="button" className={`cdt-topic-btn ${formData.topics.includes(t) ? 'selected' : ''}`}
                  onClick={() => setFormData(p => ({ ...p, topics: p.topics.includes(t) ? p.topics.filter(x => x !== t) : [...p.topics, t] }))}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="cdt-form-group">
            <label>Duration</label>
            <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: +e.target.value })}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          <button type="submit" className="cdt-start-btn" disabled={loading}>
            {loading ? 'Starting...' : '🎯 Start AI Interview'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SPEC AI CHAT TAB
   ═══════════════════════════════════════════════════════════════════ */
function AxiomTab({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(p => [...p, { role: 'user', content: input }]);
    setInput(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/spec-ai/chat`, {
        message: input,
        conversationHistory: messages,
        userData: user ? {
          id: user.id || user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          skills: user.skills || [],
          bio: user.bio || '',
          companyName: user.companyName || '',
        } : null,
      });
      setMessages(p => [...p, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const suggestions = [
    'What jobs match my skills?',
    'Help me prepare for my upcoming interview',
    'What skills should I learn next?',
    'Review my application strategy',
    'Explain binary search algorithm',
    'Best practices for React development',
  ];

  return (
    <div className="cdt-chat-layout">
      <div className="cdt-chat-header">
        <div>
          <h2>Spec AI Assistant</h2>
          <p>Your personalized AI assistant for career guidance & interview preparation</p>
        </div>
        {messages.length > 0 && (
          <button className="cdt-clear-btn" onClick={() => setMessages([])}><Trash2 size={14} /> Clear</button>
        )}
      </div>

      <div className="cdt-chat-messages">
        {messages.length === 0 ? (
          <div className="cdt-chat-welcome">
            <h3>👋 Welcome to Spec AI{user ? `, ${user.username}` : ''}!</h3>
            <p>I'm your personalized AI assistant. I know your profile and can help with career guidance, interview prep, and coding.</p>
            <div className="cdt-suggestions">
              <h4>Try asking me:</h4>
              {suggestions.map((s, i) => (
                <button key={i} className="cdt-suggestion-btn" onClick={() => { setInput(s); }}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`cdt-msg ${msg.role}`}>
              <div className="cdt-msg-content">{msg.content}</div>
            </div>
          ))
        )}
        {loading && (
          <div className="cdt-msg assistant">
            <div className="cdt-msg-content cdt-typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="cdt-chat-input" onSubmit={handleSend}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Spec AI anything..." disabled={loading} />
        <button type="submit" disabled={loading || !input.trim()}><Send size={16} /></button>
      </form>
    </div>
  );
}

export default CandidateDashboard;
