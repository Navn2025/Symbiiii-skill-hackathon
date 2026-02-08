import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Bell, LogOut, Plus, Users, BarChart3, Briefcase,
  FileText, Video, Zap, Eye, TrendingUp, Star, ChevronRight,
  Calendar, Clock, MapPin, Building2, CheckCircle2, XCircle,
  Timer, PlayCircle, Settings, Award, Target, Filter,
  ArrowUpRight, PieChart, Activity, TrendingDown, UserCheck,
  Globe, DollarSign, Percent, Trophy
} from 'lucide-react';
import axios from 'axios';
import './CompanyDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── MOCK DATA ──────────────────────────────────────────────── */
const MOCK_JOBS = [
  { id: 'm1', title: 'Senior React Developer', department: 'Engineering', location: 'Remote', type: 'Full-Time', status: 'active', applicantCount: 34, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), salary: '₹18-25 LPA' },
  { id: 'm2', title: 'Backend Engineer (Node.js)', department: 'Engineering', location: 'Hybrid', type: 'Full-Time', status: 'active', applicantCount: 28, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), salary: '₹15-22 LPA' },
  { id: 'm3', title: 'UI/UX Designer', department: 'Design', location: 'On-site', type: 'Full-Time', status: 'active', applicantCount: 19, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), salary: '₹12-18 LPA' },
  { id: 'm4', title: 'DevOps Engineer', department: 'Infrastructure', location: 'Remote', type: 'Contract', status: 'active', applicantCount: 12, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), salary: '₹20-30 LPA' },
  { id: 'm5', title: 'Data Analyst Intern', department: 'Analytics', location: 'On-site', type: 'Internship', status: 'draft', applicantCount: 0, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), salary: '₹25K/mo' },
  { id: 'm6', title: 'Product Manager', department: 'Product', location: 'Hybrid', type: 'Full-Time', status: 'active', applicantCount: 22, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), salary: '₹22-35 LPA' },
];

const MOCK_CANDIDATES = [
  { id: 'c1', candidate: { name: 'Arjun Mehta' }, appliedFor: 'Senior React Developer', round: 'Technical', score: 92, status: 'in-progress', appliedDate: '2 days ago' },
  { id: 'c2', candidate: { name: 'Priya Sharma' }, appliedFor: 'Backend Engineer', round: 'System Design', score: 87, status: 'in-progress', appliedDate: '3 days ago' },
  { id: 'c3', candidate: { name: 'Ravi Kumar' }, appliedFor: 'Senior React Developer', round: 'HR', score: 78, status: 'pending', appliedDate: '5 days ago' },
  { id: 'c4', candidate: { name: 'Sneha Patel' }, appliedFor: 'UI/UX Designer', round: 'Portfolio Review', score: 95, status: 'passed', appliedDate: '1 day ago' },
  { id: 'c5', candidate: { name: 'Vikram Singh' }, appliedFor: 'DevOps Engineer', round: 'Technical', score: 68, status: 'pending', appliedDate: '4 days ago' },
  { id: 'c6', candidate: { name: 'Anita Desai' }, appliedFor: 'Product Manager', round: 'Case Study', score: 84, status: 'in-progress', appliedDate: '2 days ago' },
  { id: 'c7', candidate: { name: 'Mohammed Ali' }, appliedFor: 'Backend Engineer', round: 'Applied', score: 0, status: 'pending', appliedDate: '1 day ago' },
  { id: 'c8', candidate: { name: 'Kavya Nair' }, appliedFor: 'Data Analyst Intern', round: 'Screening', score: 72, status: 'in-progress', appliedDate: '6 days ago' },
];

const DEMO_QUIZZES = [
  { id: 1, title: 'JavaScript Fundamentals', round: 'Round 1', questions: 20, duration: '30 min', participants: 24, status: 'completed', avgScore: 76 },
  { id: 2, title: 'React & System Design', round: 'Round 2', questions: 15, duration: '45 min', participants: 12, status: 'scheduled', avgScore: 0 },
  { id: 3, title: 'Behavioral Assessment', round: 'Round 3', questions: 10, duration: '20 min', participants: 0, status: 'draft', avgScore: 0 },
  { id: 4, title: 'SQL & Database Design', round: 'Round 1', questions: 18, duration: '35 min', participants: 31, status: 'completed', avgScore: 82 },
];

/* Analytics data */
const MONTHLY_APPLICATIONS = [
  { month: 'Aug', value: 32 }, { month: 'Sep', value: 45 }, { month: 'Oct', value: 38 },
  { month: 'Nov', value: 52 }, { month: 'Dec', value: 61 }, { month: 'Jan', value: 78 }, { month: 'Feb', value: 93 },
];

const DEPT_DISTRIBUTION = [
  { label: 'Engineering', value: 45, color: '#3b82f6' },
  { label: 'Design', value: 18, color: '#a855f7' },
  { label: 'Product', value: 15, color: '#14b8a6' },
  { label: 'Analytics', value: 12, color: '#eab308' },
  { label: 'Infrastructure', value: 10, color: '#ef4444' },
];

const SOURCE_DATA = [
  { label: 'Direct Apply', value: 38, color: '#3b82f6' },
  { label: 'LinkedIn', value: 28, color: '#0077b5' },
  { label: 'Referral', value: 20, color: '#22c55e' },
  { label: 'Career Page', value: 14, color: '#a855f7' },
];

const WEEKLY_INTERVIEWS = [
  { day: 'Mon', count: 4 }, { day: 'Tue', count: 7 }, { day: 'Wed', count: 5 },
  { day: 'Thu', count: 9 }, { day: 'Fri', count: 6 }, { day: 'Sat', count: 2 }, { day: 'Sun', count: 1 },
];

const SKILL_SCORES = [
  { skill: 'JavaScript', avg: 82 }, { skill: 'React', avg: 76 }, { skill: 'Node.js', avg: 71 },
  { skill: 'System Design', avg: 65 }, { skill: 'SQL', avg: 78 }, { skill: 'Python', avg: 69 },
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
  { key: 'jobs', label: 'Job Postings', icon: <Briefcase size={16} /> },
  { key: 'candidates', label: 'Candidates', icon: <Users size={16} /> },
  { key: 'quiz', label: 'Live Quiz', icon: <Zap size={16} /> },
  { key: 'interviews', label: 'Interviews', icon: <Video size={16} /> },
  { key: 'reports', label: 'Analytics', icon: <PieChart size={16} /> },
];

function CompanyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', department: '', location: 'Remote', type: 'Full-Time', description: '', requirements: '' });
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [quizzes, setQuizzes] = useState(DEMO_QUIZZES);
  const [companyStats, setCompanyStats] = useState({ activeJobs: 5, totalApplicants: 115, inInterview: 22, offered: 11, hired: 7 });
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobApplicants, setSelectedJobApplicants] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        fetchCompanyData(u.id);
      } else {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCompanyData = async (userId) => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs/company/${userId}`).catch(() => ({ data: { jobs: [] } })),
        axios.get(`${API_URL}/api/jobs/company-stats/${userId}`).catch(() => ({ data: {} })),
      ]);
      const realJobs = jobsRes.data.jobs || [];
      setJobs([...realJobs, ...MOCK_JOBS]);
      const s = statsRes.data;
      setCompanyStats({
        activeJobs: (s.activeJobs || 0) + 5,
        totalApplicants: (s.totalApplicants || 0) + 115,
        inInterview: (s.inInterview || 0) + 22,
        offered: (s.offered || 0) + 11,
        hired: (s.hired || 0) + 7,
      });
    } catch (err) {
      console.error('Fetch company data error:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}/applicants`);
      setCandidates(res.data.applicants || []);
    } catch (err) {
      console.error('Fetch applicants error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.department) return;
    try {
      const res = await axios.post(`${API_URL}/api/jobs`, {
        ...jobForm,
        userId: user.id,
        companyName: user.companyName || user.username,
      });
      setJobs([res.data.job, ...jobs]);
      setJobForm({ title: '', department: '', location: 'Remote', type: 'Full-Time', description: '', requirements: '' });
      setShowPostJobModal(false);
      // Refresh stats
      fetchCompanyData(user.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post job');
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  if (!user) return null;
  const initials = (user.username || 'C').charAt(0).toUpperCase();

  const overviewStats = [
    { label: 'ACTIVE JOBS', value: companyStats.activeJobs || jobs.length, icon: <Briefcase size={20} />, color: '#3b82f6', change: `${jobs.length} total` },
    { label: 'APPLICANTS', value: companyStats.totalApplicants, icon: <Users size={20} />, color: '#a855f7', change: `${companyStats.inInterview} in interview` },
    { label: 'OFFERED', value: companyStats.offered, icon: <Award size={20} />, color: '#14b8a6', change: `${companyStats.hired} hired` },
    { label: 'HIRE RATE', value: companyStats.totalApplicants > 0 ? `${Math.round((companyStats.hired / companyStats.totalApplicants) * 100)}%` : '0%', icon: <TrendingUp size={20} />, color: '#22c55e', change: 'overall' },
  ];

  return (
    <div className="cmpd-page">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="cmpd-navbar">
        <div className="cmpd-navbar-inner">
          <Link to="/company-dashboard" className="cmpd-logo">HireSpec</Link>
          <div className="cmpd-nav-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`cmpd-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="cmpd-nav-right">
            <div className="cmpd-search-box">
              <Search size={16} />
              <input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="cmpd-icon-btn" title="Notifications"><Bell size={18} /></button>
            <button className="cmpd-icon-btn" title="Logout" onClick={handleLogout}><LogOut size={18} /></button>
            <div className="cmpd-avatar">{initials}</div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="cmpd-main">
        <div className="cmpd-container">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Company Dashboard</h1>
                  <p>Welcome back, {user.username}. Here's your hiring overview.</p>
                </div>
                <button className="cmpd-btn-secondary" onClick={() => navigate('/admin-scoring')}>
                  <Trophy size={16} /> Scoring & Rankings
                </button>
                <button className="cmpd-btn-primary" onClick={() => { setActiveTab('jobs'); setShowPostJobModal(true); }}>
                  <Plus size={16} /> Post New Job
                </button>
              </div>

              <div className="cmpd-stats-row">
                {overviewStats.map((s) => (
                  <div className="cmpd-stat-card" key={s.label}>
                    <div className="cmpd-stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
                    <div className="cmpd-stat-info">
                      <span className="cmpd-stat-label">{s.label}</span>
                      <span className="cmpd-stat-value">{s.value}</span>
                      <span className="cmpd-stat-change">{s.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cmpd-overview-grid">
                {/* Recent Jobs */}
                <div className="cmpd-card">
                  <div className="cmpd-card-header">
                    <h3><Briefcase size={18} /> Recent Postings</h3>
                    <button className="cmpd-link-btn" onClick={() => setActiveTab('jobs')}>View All <ArrowUpRight size={14} /></button>
                  </div>
                  <div className="cmpd-card-body">
                    {jobs.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#737373' }}>No jobs posted yet</div>
                    ) : jobs.slice(0, 3).map((job) => (
                      <div className="cmpd-list-item" key={job.id}>
                        <div className="cmpd-list-info">
                          <strong>{job.title}</strong>
                          <span>{job.department} · {job.location} · {timeAgo(job.createdAt)}</span>
                        </div>
                        <div className="cmpd-list-meta">
                          <span className="cmpd-applicant-count"><Users size={14} /> {job.applicantCount || 0}</span>
                          <span className={`cmpd-status-dot ${job.status}`}>{job.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline Overview */}
                <div className="cmpd-card">
                  <div className="cmpd-card-header">
                    <h3><Activity size={18} /> Hiring Pipeline</h3>
                  </div>
                  <div className="cmpd-card-body">
                    <div className="cmpd-pipeline">
                      <div className="cmpd-pipeline-stage">
                        <div className="cmpd-pipeline-bar" style={{ width: '100%', background: '#3b82f6' }}></div>
                        <span>Applied <strong>54</strong></span>
                      </div>
                      <div className="cmpd-pipeline-stage">
                        <div className="cmpd-pipeline-bar" style={{ width: '65%', background: '#a855f7' }}></div>
                        <span>Screened <strong>35</strong></span>
                      </div>
                      <div className="cmpd-pipeline-stage">
                        <div className="cmpd-pipeline-bar" style={{ width: '40%', background: '#14b8a6' }}></div>
                        <span>Interview <strong>22</strong></span>
                      </div>
                      <div className="cmpd-pipeline-stage">
                        <div className="cmpd-pipeline-bar" style={{ width: '20%', background: '#22c55e' }}></div>
                        <span>Offered <strong>11</strong></span>
                      </div>
                      <div className="cmpd-pipeline-stage">
                        <div className="cmpd-pipeline-bar" style={{ width: '13%', background: '#eab308' }}></div>
                        <span>Hired <strong>7</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming */}
                <div className="cmpd-card">
                  <div className="cmpd-card-header">
                    <h3><Calendar size={18} /> Upcoming</h3>
                  </div>
                  <div className="cmpd-card-body">
                    <div className="cmpd-schedule-item">
                      <div className="cmpd-schedule-time"><Clock size={14} /> Today, 3:00 PM</div>
                      <strong>Technical Interview – Arjun Mehta</strong>
                      <span>Senior Frontend Developer</span>
                    </div>
                    <div className="cmpd-schedule-item">
                      <div className="cmpd-schedule-time"><Clock size={14} /> Tomorrow, 11:00 AM</div>
                      <strong>Live Coding Quiz – Round 2</strong>
                      <span>12 participants</span>
                    </div>
                    <div className="cmpd-schedule-item">
                      <div className="cmpd-schedule-time"><Clock size={14} /> Feb 10, 2:00 PM</div>
                      <strong>HR Round – Sneha Patel</strong>
                      <span>Final round</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Job Postings</h1>
                  <p>Manage your active job listings</p>
                </div>
                <button className="cmpd-btn-primary" onClick={() => setShowPostJobModal(true)}>
                  <Plus size={16} /> Post New Job
                </button>
              </div>

              <div className="cmpd-jobs-grid">
                {jobs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#737373', gridColumn: '1 / -1' }}>
                    <Briefcase size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <h3 style={{ color: '#a3a3a3' }}>No jobs posted yet</h3>
                    <p>Click "Post New Job" to create your first listing</p>
                  </div>
                ) : jobs.map((job) => (
                  <div className="cmpd-job-card" key={job.id}>
                    <div className="cmpd-job-top">
                      <div className="cmpd-job-icon"><Briefcase size={20} /></div>
                      <span className={`cmpd-status-pill ${job.status}`}>{job.status}</span>
                    </div>
                    <h3>{job.title}</h3>
                    <div className="cmpd-job-tags">
                      <span><Building2 size={13} /> {job.department}</span>
                      <span><MapPin size={13} /> {job.location}</span>
                      <span><Clock size={13} /> {job.type}</span>
                    </div>
                    <div className="cmpd-job-footer">
                      <span><Users size={14} /> {job.applicantCount || 0} applicants</span>
                      <span className="cmpd-job-date">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CANDIDATES TAB */}
          {activeTab === 'candidates' && (
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Candidate Management</h1>
                  <p>Track and manage all applicants across job postings</p>
                </div>
                <div className="cmpd-filter-row">
                  <button className={`cmpd-filter-btn ${!selectedJobApplicants ? 'active' : ''}`} onClick={() => { setSelectedJobApplicants(null); setCandidates(MOCK_CANDIDATES); }}>All</button>
                  {jobs.slice(0, 4).map((j) => (
                    <button key={j.id} className={`cmpd-filter-btn ${selectedJobApplicants === j.id ? 'active' : ''}`} onClick={() => { setSelectedJobApplicants(j.id); fetchApplicants(j.id); }}>
                      {j.title.substring(0, 18)}{j.title.length > 18 ? '…' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cmpd-table-card">
                <table className="cmpd-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied For</th>
                      <th>Current Round</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#737373' }}>
                          No applicants yet for this job
                        </td>
                      </tr>
                    ) : candidates.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="cmpd-cand-name">
                            <div className="cmpd-cand-avatar">{(c.candidate?.name || 'U').charAt(0).toUpperCase()}</div>
                            {c.candidate?.name || 'Unknown'}
                          </div>
                        </td>
                        <td>{c.appliedFor || jobs.find(j => j.id === selectedJobApplicants)?.title || '—'}</td>
                        <td>{c.round || 'Applied'}</td>
                        <td>
                          {c.score > 0 ? (
                            <span className={`cmpd-score ${c.score >= 80 ? 'high' : c.score >= 60 ? 'mid' : 'low'}`}>{c.score}%</span>
                          ) : '—'}
                        </td>
                        <td><span className={`cmpd-status-pill ${c.status}`}>{(c.status || '').replace('-', ' ')}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.appliedDate || '—'}</td>
                        <td>
                          <button className="cmpd-action-btn">
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Live Quiz Management</h1>
                  <p>Create and manage quizzes for each hiring round</p>
                </div>
                <button className="cmpd-btn-primary">
                  <Plus size={16} /> Create Quiz
                </button>
              </div>

              <div className="cmpd-quiz-grid">
                {quizzes.map((q) => (
                  <div className="cmpd-quiz-card" key={q.id}>
                    <div className="cmpd-quiz-top">
                      <div className="cmpd-quiz-icon"><Zap size={20} /></div>
                      <span className={`cmpd-status-pill ${q.status}`}>{q.status}</span>
                    </div>
                    <h3>{q.title}</h3>
                    <span className="cmpd-quiz-round">{q.round}</span>
                    <div className="cmpd-quiz-meta">
                      <span><FileText size={13} /> {q.questions} questions</span>
                      <span><Timer size={13} /> {q.duration}</span>
                      <span><Users size={13} /> {q.participants} participants</span>
                    </div>
                    <div className="cmpd-quiz-actions">
                      {q.status === 'scheduled' && (
                        <button className="cmpd-btn-primary cmpd-btn-sm">
                          <PlayCircle size={14} /> Start Live
                        </button>
                      )}
                      {q.status === 'completed' && (
                        <button className="cmpd-btn-secondary cmpd-btn-sm">
                          <BarChart3 size={14} /> View Results
                        </button>
                      )}
                      {q.status === 'draft' && (
                        <button className="cmpd-btn-secondary cmpd-btn-sm">
                          <Settings size={14} /> Configure
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* INTERVIEWS TAB */}
          {activeTab === 'interviews' && (
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Interview Management</h1>
                  <p>Schedule and conduct live interviews with proctoring</p>
                </div>
                <button className="cmpd-btn-primary" onClick={() => navigate('/')}>
                  <Video size={16} /> Start Interview
                </button>
              </div>

              <div className="cmpd-interview-grid">
                <div className="cmpd-card">
                  <div className="cmpd-card-header"><h3><Video size={18} /> Scheduled Interviews</h3></div>
                  <div className="cmpd-card-body">
                    <div className="cmpd-schedule-item">
                      <div className="cmpd-schedule-time"><Clock size={14} /> Today, 3:00 PM</div>
                      <strong>Technical Round – Arjun Mehta</strong>
                      <span>Frontend Developer · Video Call</span>
                    </div>
                    <div className="cmpd-schedule-item">
                      <div className="cmpd-schedule-time"><Clock size={14} /> Tomorrow, 11:00 AM</div>
                      <strong>System Design – Priya Sharma</strong>
                      <span>Backend Engineer · Video + Code</span>
                    </div>
                  </div>
                </div>

                <div className="cmpd-card">
                  <div className="cmpd-card-header"><h3><Award size={18} /> Interview Tools</h3></div>
                  <div className="cmpd-card-body">
                    <div className="cmpd-tool-item" onClick={() => navigate('/proctor-dashboard')}>
                      <Eye size={18} /> <span>Proctor Dashboard</span> <ChevronRight size={16} />
                    </div>
                    <div className="cmpd-tool-item" onClick={() => navigate('/recruiter-dashboard')}>
                      <Target size={18} /> <span>Recruiter Panel</span> <ChevronRight size={16} />
                    </div>
                    <div className="cmpd-tool-item" onClick={() => navigate('/ai-interview-setup')}>
                      <Zap size={18} /> <span>AI Interviewer</span> <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'reports' && (
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Analytics & Reports</h1>
                  <p>Comprehensive hiring metrics, trends, and performance insights</p>
                </div>
              </div>

              {/* KPI Row */}
              <div className="cmpd-stats-row" style={{ marginBottom: '1.5rem' }}>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{ color: '#3b82f6', background: '#3b82f615' }}><Users size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">TOTAL APPLICATIONS</span>
                    <span className="cmpd-stat-value">115</span>
                    <span className="cmpd-stat-change" style={{ color: '#22c55e' }}>↑ 23% vs last month</span>
                  </div>
                </div>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{ color: '#a855f7', background: '#a855f715' }}><UserCheck size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">OFFER ACCEPTANCE</span>
                    <span className="cmpd-stat-value">82%</span>
                    <span className="cmpd-stat-change" style={{ color: '#22c55e' }}>↑ 5% improvement</span>
                  </div>
                </div>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{ color: '#14b8a6', background: '#14b8a615' }}><Clock size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">AVG TIME TO HIRE</span>
                    <span className="cmpd-stat-value">14 days</span>
                    <span className="cmpd-stat-change" style={{ color: '#22c55e' }}>↓ 3 days faster</span>
                  </div>
                </div>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{ color: '#eab308', background: '#eab30815' }}><DollarSign size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">COST PER HIRE</span>
                    <span className="cmpd-stat-value">₹4,200</span>
                    <span className="cmpd-stat-change" style={{ color: '#22c55e' }}>↓ 12% reduced</span>
                  </div>
                </div>
              </div>

              {/* Row 1: Applications Trend + Hiring Funnel */}
              <div className="cmpd-analytics-row">
                <div className="cmpd-card cmpd-analytics-card">
                  <div className="cmpd-card-header">
                    <h3><TrendingUp size={18} /> Application Trend (Monthly)</h3>
                  </div>
                  <div className="cmpd-card-body" style={{ padding: '1.5rem' }}>
                    <div className="cmpd-bar-chart">
                      {MONTHLY_APPLICATIONS.map((d) => {
                        const maxVal = Math.max(...MONTHLY_APPLICATIONS.map(m => m.value));
                        return (
                          <div className="cmpd-bar-col" key={d.month}>
                            <div className="cmpd-bar-value">{d.value}</div>
                            <div className="cmpd-bar-track">
                              <div className="cmpd-bar-fill" style={{ height: `${(d.value / maxVal) * 100}%`, background: 'linear-gradient(180deg, #3b82f6, #6366f1)' }} />
                            </div>
                            <div className="cmpd-bar-label">{d.month}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="cmpd-card cmpd-analytics-card">
                  <div className="cmpd-card-header">
                    <h3><Activity size={18} /> Hiring Funnel</h3>
                  </div>
                  <div className="cmpd-card-body" style={{ padding: '1.5rem' }}>
                    <div className="cmpd-funnel">
                      {[
                        { stage: 'Applied', count: 115, pct: 100, color: '#3b82f6' },
                        { stage: 'Screened', count: 78, pct: 68, color: '#8b5cf6' },
                        { stage: 'Interview', count: 42, pct: 37, color: '#a855f7' },
                        { stage: 'Technical', count: 28, pct: 24, color: '#14b8a6' },
                        { stage: 'Offered', count: 11, pct: 10, color: '#22c55e' },
                        { stage: 'Hired', count: 7, pct: 6, color: '#eab308' },
                      ].map((s) => (
                        <div className="cmpd-funnel-row" key={s.stage}>
                          <span className="cmpd-funnel-label">{s.stage}</span>
                          <div className="cmpd-funnel-track">
                            <div className="cmpd-funnel-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                          </div>
                          <span className="cmpd-funnel-count">{s.count}</span>
                          <span className="cmpd-funnel-pct">{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Department Distribution + Source Breakdown */}
              <div className="cmpd-analytics-row" style={{ marginTop: '1.25rem' }}>
                <div className="cmpd-card cmpd-analytics-card">
                  <div className="cmpd-card-header">
                    <h3><PieChart size={18} /> Applicants by Department</h3>
                  </div>
                  <div className="cmpd-card-body" style={{ padding: '1.5rem' }}>
                    <div className="cmpd-donut-container">
                      <div className="cmpd-donut">
                        <svg viewBox="0 0 36 36">
                          {(() => {
                            let offset = 0;
                            const total = DEPT_DISTRIBUTION.reduce((s, d) => s + d.value, 0);
                            return DEPT_DISTRIBUTION.map((d) => {
                              const pct = (d.value / total) * 100;
                              const el = (
                                <circle key={d.label} cx="18" cy="18" r="15.915" fill="none"
                                  stroke={d.color} strokeWidth="3.5"
                                  strokeDasharray={`${pct} ${100 - pct}`}
                                  strokeDashoffset={-offset}
                                  strokeLinecap="round"
                                />
                              );
                              offset += pct;
                              return el;
                            });
                          })()}
                        </svg>
                        <div className="cmpd-donut-center">
                          <strong>100</strong>
                          <span>Total</span>
                        </div>
                      </div>
                      <div className="cmpd-donut-legend">
                        {DEPT_DISTRIBUTION.map((d) => (
                          <div className="cmpd-legend-item" key={d.label}>
                            <span className="cmpd-legend-dot" style={{ background: d.color }} />
                            <span className="cmpd-legend-label">{d.label}</span>
                            <span className="cmpd-legend-value">{d.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cmpd-card cmpd-analytics-card">
                  <div className="cmpd-card-header">
                    <h3><Globe size={18} /> Application Sources</h3>
                  </div>
                  <div className="cmpd-card-body" style={{ padding: '1.5rem' }}>
                    <div className="cmpd-horizontal-bars">
                      {SOURCE_DATA.map((s) => (
                        <div className="cmpd-h-bar-row" key={s.label}>
                          <div className="cmpd-h-bar-info">
                            <span className="cmpd-h-bar-label">{s.label}</span>
                            <span className="cmpd-h-bar-value">{s.value}%</span>
                          </div>
                          <div className="cmpd-h-bar-track">
                            <div className="cmpd-h-bar-fill" style={{ width: `${s.value}%`, background: s.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="cmpd-source-summary">
                      <div className="cmpd-mini-stat"><strong>4</strong><span>Sources</span></div>
                      <div className="cmpd-mini-stat"><strong>115</strong><span>Total Apps</span></div>
                      <div className="cmpd-mini-stat"><strong>38%</strong><span>Top Source</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Weekly Interviews + Skill Assessment Scores */}
              <div className="cmpd-analytics-row" style={{ marginTop: '1.25rem' }}>
                <div className="cmpd-card cmpd-analytics-card">
                  <div className="cmpd-card-header">
                    <h3><Video size={18} /> Interviews This Week</h3>
                  </div>
                  <div className="cmpd-card-body" style={{ padding: '1.5rem' }}>
                    <div className="cmpd-bar-chart cmpd-bar-chart-sm">
                      {WEEKLY_INTERVIEWS.map((d) => {
                        const maxVal = Math.max(...WEEKLY_INTERVIEWS.map(w => w.count));
                        return (
                          <div className="cmpd-bar-col" key={d.day}>
                            <div className="cmpd-bar-value">{d.count}</div>
                            <div className="cmpd-bar-track">
                              <div className="cmpd-bar-fill" style={{ height: `${(d.count / maxVal) * 100}%`, background: d.day === 'Thu' ? '#22c55e' : 'linear-gradient(180deg, #14b8a6, #0d9488)' }} />
                            </div>
                            <div className="cmpd-bar-label">{d.day}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="cmpd-chart-footer">
                      <span>Total: <strong>34</strong> interviews</span>
                      <span>Peak: <strong>Thursday</strong></span>
                    </div>
                  </div>
                </div>

                <div className="cmpd-card cmpd-analytics-card">
                  <div className="cmpd-card-header">
                    <h3><Award size={18} /> Avg Skill Assessment Scores</h3>
                  </div>
                  <div className="cmpd-card-body" style={{ padding: '1.5rem' }}>
                    <div className="cmpd-skill-bars">
                      {SKILL_SCORES.map((s) => (
                        <div className="cmpd-skill-row" key={s.skill}>
                          <div className="cmpd-skill-info">
                            <span>{s.skill}</span>
                            <span className={`cmpd-score ${s.avg >= 75 ? 'high' : s.avg >= 65 ? 'mid' : 'low'}`}>{s.avg}%</span>
                          </div>
                          <div className="cmpd-skill-track">
                            <div className="cmpd-skill-fill" style={{
                              width: `${s.avg}%`,
                              background: s.avg >= 75 ? '#22c55e' : s.avg >= 65 ? '#eab308' : '#ef4444'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Quick Reports */}
              <div className="cmpd-reports-grid" style={{ marginTop: '1.25rem' }}>
                <div className="cmpd-report-card">
                  <div className="cmpd-report-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}><Percent size={28} /></div>
                  <h3>Conversion Rate</h3>
                  <p>Stage-wise conversion metrics</p>
                  <div className="cmpd-report-preview">
                    <div className="cmpd-mini-stat"><strong>68%</strong><span>Screen Rate</span></div>
                    <div className="cmpd-mini-stat"><strong>37%</strong><span>Interview Rate</span></div>
                    <div className="cmpd-mini-stat"><strong>6%</strong><span>Hire Rate</span></div>
                  </div>
                </div>

                <div className="cmpd-report-card">
                  <div className="cmpd-report-icon" style={{ background: '#a855f715', color: '#a855f7' }}><BarChart3 size={28} /></div>
                  <h3>Quiz Performance</h3>
                  <p>Average scores by quiz round</p>
                  <div className="cmpd-report-preview">
                    <div className="cmpd-mini-stat"><strong>76%</strong><span>JS Fundamentals</span></div>
                    <div className="cmpd-mini-stat"><strong>82%</strong><span>SQL & DB</span></div>
                    <div className="cmpd-mini-stat"><strong>—</strong><span>React (pending)</span></div>
                  </div>
                </div>

                <div className="cmpd-report-card">
                  <div className="cmpd-report-icon" style={{ background: '#22c55e15', color: '#22c55e' }}><TrendingUp size={28} /></div>
                  <h3>Hiring Velocity</h3>
                  <p>Speed of hiring pipeline</p>
                  <div className="cmpd-report-preview">
                    <div className="cmpd-mini-stat"><strong>14</strong><span>Avg Days</span></div>
                    <div className="cmpd-mini-stat"><strong>-3d</strong><span>vs Last Month</span></div>
                    <div className="cmpd-mini-stat"><strong>92%</strong><span>On-time</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Post Job Modal ─────────────────────────────────── */}
      {showPostJobModal && (
        <div className="cmpd-modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="cmpd-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Post New Job</h2>
            <p className="cmpd-modal-sub">Fill in the details to create a new job listing</p>

            <div className="cmpd-form-group">
              <label>Job Title</label>
              <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Senior React Developer" />
            </div>

            <div className="cmpd-form-row">
              <div className="cmpd-form-group">
                <label>Department</label>
                <input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} placeholder="e.g. Engineering" />
              </div>
              <div className="cmpd-form-group">
                <label>Location</label>
                <select value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}>
                  <option>Remote</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            <div className="cmpd-form-group">
              <label>Job Type</label>
              <select value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}>
                <option>Full-Time</option>
                <option>Part-Time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>

            <div className="cmpd-form-group">
              <label>Description</label>
              <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Job description..." rows={4}></textarea>
            </div>

            <div className="cmpd-form-group">
              <label>Requirements</label>
              <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder="Key requirements..." rows={3}></textarea>
            </div>

            <div className="cmpd-modal-actions">
              <button className="cmpd-btn-secondary" onClick={() => setShowPostJobModal(false)}>Cancel</button>
              <button className="cmpd-btn-primary" onClick={handlePostJob}>Post Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;
