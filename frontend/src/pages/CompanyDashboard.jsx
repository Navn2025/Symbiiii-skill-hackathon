import {useState, useEffect} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import
{
  Search, Bell, LogOut, Plus, Users, BarChart3, Briefcase,
  FileText, Video, Zap, Eye, TrendingUp, Star, ChevronRight,
  Calendar, Clock, MapPin, Building2, CheckCircle2, XCircle,
  Timer, PlayCircle, Settings, Award, Target, Filter,
  ArrowUpRight, PieChart, Activity, Percent, Trophy,
  Bot, Loader, Check, X, Sparkles, RefreshCw, Trash2
} from 'lucide-react';
import api, {createInterview, scheduleInterview, getJobInterviews} from '../services/api';
import './CompanyDashboard.css';

const TABS=[
  {key: 'overview', label: 'Overview', icon: <BarChart3 size={16} />},
  {key: 'jobs', label: 'Job Postings', icon: <Briefcase size={16} />},
  {key: 'candidates', label: 'Candidates', icon: <Users size={16} />},
  {key: 'quiz', label: 'Live Quiz', icon: <Zap size={16} />},
  {key: 'interviews', label: 'Interviews', icon: <Video size={16} />},
  {key: 'reports', label: 'Analytics', icon: <PieChart size={16} />},
];

function CompanyDashboard()
{
  const navigate=useNavigate();
  const [user, setUser]=useState(null);
  const [activeTab, setActiveTab]=useState('overview');
  const [searchQuery, setSearchQuery]=useState('');
  const [showPostJobModal, setShowPostJobModal]=useState(false);
  const [jobForm, setJobForm]=useState({title: '', department: '', location: 'Remote', type: 'Full-Time', description: '', requirements: ''});
  const [jobs, setJobs]=useState([]);
  const [candidates, setCandidates]=useState([]);
  const [quizzes, setQuizzes]=useState([]);
  const [loadingQuizzes, setLoadingQuizzes]=useState(false);
  const [showCreateQuiz, setShowCreateQuiz]=useState(false);
  const [quizForm, setQuizForm]=useState({title: '', topic: '', description: '', difficulty: 'medium', questionTimeLimit: 20, questionCount: 5});
  const [creatingQuiz, setCreatingQuiz]=useState(false);
  const [wizardStep, setWizardStep]=useState(1); // 1=details, 2=questions, 3=review
  const [generatingAI, setGeneratingAI]=useState(false);
  const [generatedQuestions, setGeneratedQuestions]=useState([]);
  const [quizError, setQuizError]=useState('');
  const [createdQuizId, setCreatedQuizId]=useState(null);
  const [companyStats, setCompanyStats]=useState({activeJobs: 0, totalApplicants: 0, inInterview: 0, offered: 0, hired: 0});
  const [loadingJobs, setLoadingJobs]=useState(true);
  const [selectedJobApplicants, setSelectedJobApplicants]=useState(null);
  const [startingInterview, setStartingInterview]=useState(false);
  const [scheduledInterviews, setScheduledInterviews]=useState([]);
  const [schedulingCandidate, setSchedulingCandidate]=useState(null);
  const [copiedLink, setCopiedLink]=useState(null);
  const [jobWiseCandidates, setJobWiseCandidates]=useState({});
  const [loadingAllCandidates, setLoadingAllCandidates]=useState(false);

  const fetchCompanyQuizzes=async () =>
  {
    setLoadingQuizzes(true);
    try
    {
      const res=await fetch(`${import.meta.env.VITE_API_URL||'http://localhost:5000'}/api/quiz/my-quizzes`, {credentials: 'include'});
      if (res.ok) { const data=await res.json(); setQuizzes(data.quizzes||[]); }
    } catch (e) { console.error('Fetch quizzes error:', e); }
    finally { setLoadingQuizzes(false); }
  };

  const API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000';

  const resetQuizWizard=() => {
    setShowCreateQuiz(false);
    setWizardStep(1);
    setQuizForm({title: '', topic: '', description: '', difficulty: 'medium', questionTimeLimit: 20, questionCount: 5});
    setGeneratedQuestions([]);
    setQuizError('');
    setCreatedQuizId(null);
    setCreatingQuiz(false);
    setGeneratingAI(false);
  };

  // Step 1 → Step 2: Create the quiz shell in DB
  const handleCreateQuizShell=async () =>
  {
    if (!quizForm.title.trim()||!quizForm.topic.trim()) return;
    setCreatingQuiz(true);
    setQuizError('');
    try
    {
      const res=await fetch(`${API_URL}/api/quiz/create`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include',
        body: JSON.stringify(quizForm),
      });
      const data=await res.json();
      if (res.ok && data.success)
      {
        setCreatedQuizId(data.quiz.id);
        setWizardStep(2);
      } else { setQuizError(data.error||'Failed to create quiz. Check your connection.'); }
    } catch (e) { setQuizError('Network error — is the backend running?'); }
    finally { setCreatingQuiz(false); }
  };

  // Step 2: Generate questions with AI
  const handleAIGenerate=async () =>
  {
    setGeneratingAI(true);
    setQuizError('');
    try
    {
      const res=await fetch(`${API_URL}/api/quiz/generate-questions`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include',
        body: JSON.stringify({
          topic: quizForm.topic,
          count: quizForm.questionCount,
          difficulty: quizForm.difficulty,
          type: 'mcq',
          existingQuestions: generatedQuestions,
        }),
      });
      const data=await res.json();
      if (res.ok && data.success)
      {
        setGeneratedQuestions(prev => [...prev, ...data.questions]);
        setWizardStep(3);
      } else { setQuizError(data.error||'AI generation failed. Try again.'); }
    } catch (e) { setQuizError('Network error calling AI.'); }
    finally { setGeneratingAI(false); }
  };

  // Step 3 → Finish: Save questions to quiz and optionally publish
  const handleFinishQuiz=async (publish=false) =>
  {
    if (!createdQuizId||generatedQuestions.length===0) return;
    setCreatingQuiz(true);
    setQuizError('');
    try
    {
      // Add questions
      const addRes=await fetch(`${API_URL}/api/quiz/${createdQuizId}/questions`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include',
        body: JSON.stringify({questions: generatedQuestions, replace: true}),
      });
      if (!addRes.ok) { const e=await addRes.json().catch(() => ({})); setQuizError(e.error||'Failed to save questions'); return; }

      // Optionally publish
      if (publish)
      {
        const pubRes=await fetch(`${API_URL}/api/quiz/${createdQuizId}/publish`, {
          method: 'POST', credentials: 'include',
        });
        if (!pubRes.ok) { const e=await pubRes.json().catch(() => ({})); setQuizError(e.error||'Failed to publish'); return; }
      }

      resetQuizWizard();
      fetchCompanyQuizzes();
      if (publish) navigate(`/quiz/host/${createdQuizId}`);
    } catch (e) { setQuizError('Network error'); }
    finally { setCreatingQuiz(false); }
  };

  const removeQuestion=(idx) => setGeneratedQuestions(prev => prev.filter((_, i) => i!==idx));

  // Fetch quizzes when tab switches to quiz
  useEffect(() => { if (activeTab==='quiz') fetchCompanyQuizzes(); }, [activeTab]);

  const handleStartInterview=async () =>
  {
    if (startingInterview) return;
    setStartingInterview(true);
    try
    {
      const sessionId=`interview-${Date.now()}`;
      await createInterview({
        candidateName: 'Pending Candidate',
        role: 'Software Engineer',
        experience: 'entry',
        topics: [],
        duration: 30,
        notes: 'Created by recruiter from Company Dashboard',
        sessionId,
      });
      navigate(`/interview/${sessionId}?mode=recruiter&name=${encodeURIComponent(user?.username||user?.name||'Recruiter')}&role=recruiter`);
    } catch (error)
    {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview session. Please try again.');
    } finally
    {
      setStartingInterview(false);
    }
  };

  const handleScheduleInterview=async (candidateObj, jobId, applicationId) =>
  {
    if (schedulingCandidate) return;
    const candId=candidateObj?.candidate?.id||candidateObj?.candidateId;
    const appId=applicationId||candidateObj?.id;
    if (!candId||!jobId) return alert('Missing candidate or job information');
    setSchedulingCandidate(candId);
    try
    {
      const res=await scheduleInterview({
        candidateId: candId,
        jobId,
        applicationId: appId,
        duration: 30,
      });
      const data=res.data?.data||res.data;
      const link=data.interviewLink||data.interview?.sessionId;
      alert(`Interview scheduled!\nLink: ${link}\nCandidate: ${data.candidateName}`);
      // Refresh applicants
      if (selectedJobApplicants) fetchApplicants(selectedJobApplicants);
      fetchScheduledInterviews();
    } catch (err)
    {
      console.error('Schedule interview error:', err);
      alert(err.response?.data?.error||'Failed to schedule interview');
    } finally
    {
      setSchedulingCandidate(null);
    }
  };

  const handleCopyLink=(sessionId) =>
  {
    const fullLink=`${window.location.origin}/interview/${sessionId}?mode=candidate`;
    navigator.clipboard.writeText(fullLink).then(() =>
    {
      setCopiedLink(sessionId);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const handleJoinAsRecruiter=(sessionId) =>
  {
    navigate(`/interview/${sessionId}?mode=recruiter&name=${encodeURIComponent(user?.username||user?.name||'Recruiter')}&role=recruiter`);
  };

  const fetchScheduledInterviews=async () =>
  {
    try
    {
      // Fetch interviews for all user's jobs
      const jobsRes=await api.get(`/jobs/company/${user?.id}`).catch(() => ({data: {jobs: []}}));
      const realJobs=jobsRes.data.jobs||[];
      const allInterviews=[];
      for (const j of realJobs.slice(0, 10))
      {
        try
        {
          const res=await getJobInterviews(j.id||j._id);
          const ivs=(res.data?.data||res.data||[]).map(iv => ({...iv, jobTitle: j.title}));
          allInterviews.push(...ivs);
        } catch {}
      }
      setScheduledInterviews(allInterviews);
    } catch (err)
    {
      console.error('Fetch scheduled interviews error:', err);
    }
  };

  useEffect(() =>
  {
    try
    {
      const stored=localStorage.getItem('user');
      if (stored)
      {
        const u=JSON.parse(stored);
        setUser(u);
        fetchCompanyData(u.id);
      } else
      {
        navigate('/login');
      }
    } catch
    {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch scheduled interviews once user is loaded
  useEffect(() =>
  {
    if (user?.id) fetchScheduledInterviews();
  }, [user?.id]);

  // Fetch all candidates job-wise when switching to candidates tab
  useEffect(() =>
  {
    if (activeTab==='candidates'&&jobs.length>0&&!selectedJobApplicants)
    {
      fetchAllCandidatesByJob(jobs);
    }
  }, [activeTab, jobs.length]);

  const fetchCompanyData=async (userId) =>
  {
    try
    {
      const [jobsRes, statsRes]=await Promise.all([
        api.get(`/jobs/company/${userId}`).catch(() => ({data: {jobs: []}})),
        api.get(`/jobs/company-stats/${userId}`).catch(() => ({data: {}})),
      ]);
      const realJobs=jobsRes.data.jobs||[];
      setJobs(realJobs);
      const s=statsRes.data;
      setCompanyStats({
        activeJobs: s.activeJobs||realJobs.filter(j => j.status==='active').length,
        totalApplicants: s.totalApplicants||realJobs.reduce((sum, j) => sum+(j.applicantCount||0), 0),
        inInterview: s.inInterview||0,
        offered: s.offered||0,
        hired: s.hired||0,
      });
    } catch (err)
    {
      console.error('Fetch company data error:', err);
    } finally
    {
      setLoadingJobs(false);
    }
  };

  const fetchApplicants=async (jobId) =>
  {
    try
    {
      const res=await api.get(`/jobs/${jobId}/applicants`);
      setCandidates(res.data.applicants||[]);
    } catch (err)
    {
      console.error('Fetch applicants error:', err);
    }
  };

  const fetchAllCandidatesByJob=async (jobsList) =>
  {
    setLoadingAllCandidates(true);
    const result={};
    for (const j of jobsList)
    {
      try
      {
        const jid=j.id||j._id;
        const res=await api.get(`/jobs/${jid}/applicants`);
        const applicants=res.data.applicants||[];
        if (applicants.length>0) result[jid]={title: j.title, applicants};
      } catch {}
    }
    setJobWiseCandidates(result);
    setLoadingAllCandidates(false);
  };

  const handleLogout=() =>
  {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const handlePostJob=async () =>
  {
    if (!jobForm.title||!jobForm.department) return;
    try
    {
      const res=await api.post('/jobs', {
        ...jobForm,
        userId: user.id,
        companyName: user.companyName||user.username,
      });
      setJobs([res.data.job, ...jobs]);
      setJobForm({title: '', department: '', location: 'Remote', type: 'Full-Time', description: '', requirements: ''});
      setShowPostJobModal(false);
      // Refresh stats
      fetchCompanyData(user.id);
    } catch (err)
    {
      alert(err.response?.data?.message||'Failed to post job');
    }
  };

  const timeAgo=(dateStr) =>
  {
    const diff=Date.now()-new Date(dateStr).getTime();
    const days=Math.floor(diff/86400000);
    if (days===0) return 'Today';
    if (days===1) return 'Yesterday';
    if (days<7) return `${days}d ago`;
    return `${Math.floor(days/7)}w ago`;
  };

  if (!user) return null;
  const initials=(user.username||'C').charAt(0).toUpperCase();

  const overviewStats=[
    {label: 'ACTIVE JOBS', value: companyStats.activeJobs||jobs.length, icon: <Briefcase size={20} />, color: '#3b82f6', change: `${jobs.length} total`},
    {label: 'APPLICANTS', value: companyStats.totalApplicants, icon: <Users size={20} />, color: '#a855f7', change: `${companyStats.inInterview} in interview`},
    {label: 'OFFERED', value: companyStats.offered, icon: <Award size={20} />, color: '#14b8a6', change: `${companyStats.hired} hired`},
    {label: 'HIRE RATE', value: companyStats.totalApplicants>0? `${Math.round((companyStats.hired/companyStats.totalApplicants)*100)}%`:'0%', icon: <TrendingUp size={20} />, color: '#22c55e', change: 'overall'},
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
                className={`cmpd-tab ${activeTab===t.key? 'active':''}`}
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
          {activeTab==='overview'&&(
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Company Dashboard</h1>
                  <p>Welcome back, {user.username}. Here's your hiring overview.</p>
                </div>
                <button className="cmpd-btn-secondary" onClick={() => navigate('/admin-scoring')}>
                  <Trophy size={16} /> Scoring & Rankings
                </button>
                <button className="cmpd-btn-primary" onClick={() => {setActiveTab('jobs'); setShowPostJobModal(true);}}>
                  <Plus size={16} /> Post New Job
                </button>
              </div>

              <div className="cmpd-stats-row">
                {overviewStats.map((s) => (
                  <div className="cmpd-stat-card" key={s.label}>
                    <div className="cmpd-stat-icon" style={{color: s.color, background: `${s.color}15`}}>{s.icon}</div>
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
                    {jobs.length===0? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#737373'}}>No jobs posted yet</div>
                    ):jobs.slice(0, 3).map((job) => (
                      <div className="cmpd-list-item" key={job._id||job.id}>
                        <div className="cmpd-list-info">
                          <strong>{job.title}</strong>
                          <span>{job.department} · {job.location} · {timeAgo(job.createdAt)}</span>
                        </div>
                        <div className="cmpd-list-meta">
                          <span className="cmpd-applicant-count"><Users size={14} /> {job.applicantCount||0}</span>
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
                    {companyStats.totalApplicants===0? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#737373'}}>No applicants yet — post a job to get started</div>
                    ):(
                      <div className="cmpd-pipeline">
                        {[
                          {label: 'Applied', count: companyStats.totalApplicants, color: '#3b82f6'},
                          {label: 'Interview', count: companyStats.inInterview, color: '#14b8a6'},
                          {label: 'Offered', count: companyStats.offered, color: '#22c55e'},
                          {label: 'Hired', count: companyStats.hired, color: '#eab308'},
                        ].map((s) =>
                        {
                          const pct=companyStats.totalApplicants>0? Math.max(5, (s.count/companyStats.totalApplicants)*100):0;
                          return (
                            <div className="cmpd-pipeline-stage" key={s.label}>
                              <div className="cmpd-pipeline-bar" style={{width: `${pct}%`, background: s.color}}></div>
                              <span>{s.label} <strong>{s.count}</strong></span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming — from scheduled interviews */}
                <div className="cmpd-card">
                  <div className="cmpd-card-header">
                    <h3><Calendar size={18} /> Upcoming</h3>
                  </div>
                  <div className="cmpd-card-body">
                    {scheduledInterviews.filter(iv => iv.status==='scheduled'||iv.status==='active').length===0? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#737373'}}>No upcoming interviews</div>
                    ):scheduledInterviews
                      .filter(iv => iv.status==='scheduled'||iv.status==='active')
                      .slice(0, 3)
                      .map((iv) => (
                        <div className="cmpd-schedule-item" key={iv.sessionId}>
                          <div className="cmpd-schedule-time"><Clock size={14} /> {iv.scheduledAt? new Date(iv.scheduledAt).toLocaleString():'TBD'}</div>
                          <strong>Interview – {iv.candidateName||'Candidate'}</strong>
                          <span>{iv.jobTitle||'—'}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </>
          )}

          {/* JOBS TAB */}
          {activeTab==='jobs'&&(
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
                {jobs.length===0? (
                  <div style={{padding: '40px', textAlign: 'center', color: '#737373', gridColumn: '1 / -1'}}>
                    <Briefcase size={48} style={{marginBottom: 12, opacity: 0.3}} />
                    <h3 style={{color: '#a3a3a3'}}>No jobs posted yet</h3>
                    <p>Click "Post New Job" to create your first listing</p>
                  </div>
                ):jobs.map((job) => (
                  <div className="cmpd-job-card" key={job._id||job.id}>
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
                      <span><Users size={14} /> {job.applicantCount||0} applicants</span>
                      <span className="cmpd-job-date">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CANDIDATES TAB */}
          {activeTab==='candidates'&&(
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Candidate Management</h1>
                  <p>Job-wise listing of all applicants</p>
                </div>
                <div className="cmpd-filter-row">
                  <button className={`cmpd-filter-btn ${!selectedJobApplicants? 'active':''}`} onClick={() => {setSelectedJobApplicants(null); setCandidates([]); fetchAllCandidatesByJob(jobs);}}>All Jobs</button>
                  {jobs.map((j) => (
                    <button key={j.id||j._id} className={`cmpd-filter-btn ${selectedJobApplicants===(j.id||j._id)? 'active':''}`} onClick={() => {setSelectedJobApplicants(j.id||j._id); fetchApplicants(j.id||j._id);}}>
                      {j.title.substring(0, 18)}{j.title.length>18? '…':''} ({j.applicantCount||0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Single-job view */}
              {selectedJobApplicants? (
                <div className="cmpd-table-card">
                  <div className="cmpd-card-header" style={{padding: '12px 20px', borderBottom: '1px solid var(--border-color, #2a2a3a)'}}>
                    <h3 style={{margin: 0}}><Users size={16} /> {jobs.find(j => (j.id||j._id)===selectedJobApplicants)?.title||'Job'} — {candidates.length} applicant{candidates.length!==1? 's':''}</h3>
                  </div>
                  <table className="cmpd-table">
                    <thead>
                      <tr><th>Candidate</th><th>Round</th><th>Score</th><th>Status</th><th>Applied</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {candidates.length===0? (
                        <tr><td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#737373'}}>No applicants yet for this job</td></tr>
                      ):candidates.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="cmpd-cand-name">
                              <div className="cmpd-cand-avatar">{(c.candidate?.name||'U').charAt(0).toUpperCase()}</div>
                              <div>
                                <div>{c.candidate?.name||'Unknown'}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{c.candidate?.email||''}</div>
                              </div>
                            </div>
                          </td>
                          <td>{c.round||'Applied'}</td>
                          <td>{c.score>0? <span className={`cmpd-score ${c.score>=80? 'high':c.score>=60? 'mid':'low'}`}>{c.score}%</span>:'—'}</td>
                          <td><span className={`cmpd-status-pill ${c.status}`}>{(c.status||'').replace('-', ' ')}</span></td>
                          <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{c.appliedAt? new Date(c.appliedAt).toLocaleDateString():'—'}</td>
                          <td>
                            <div className="cmpd-actions-group">
                              <button className="cmpd-action-btn" title="View Profile"><Eye size={14} /> View</button>
                              {c.status!=='interview'&&c.status!=='rejected'&&(
                                <button className="cmpd-action-btn cmpd-action-schedule" onClick={() => handleScheduleInterview(c, selectedJobApplicants, c.id)} disabled={schedulingCandidate===c.candidate?.id} title="Schedule Interview">
                                  <Video size={14} /> {schedulingCandidate===c.candidate?.id? 'Scheduling...':'Schedule'}
                                </button>
                              )}
                              {c.status==='interview'&&<span className="cmpd-interview-scheduled-badge">📅 Scheduled</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ):(
                /* Job-wise view (All Jobs selected) */
                <div className="cmpd-jobwise-candidates">
                  {loadingAllCandidates? (
                    <div style={{textAlign: 'center', padding: '40px', color: '#737373'}}>Loading candidates...</div>
                  ):Object.keys(jobWiseCandidates).length===0? (
                    <div style={{textAlign: 'center', padding: '40px', color: '#737373'}}>
                      <Users size={40} style={{marginBottom: 12, opacity: 0.3}} />
                      <h3 style={{color: '#a3a3a3'}}>No applicants yet</h3>
                      <p>Candidates who apply for your jobs will appear here</p>
                    </div>
                  ):Object.entries(jobWiseCandidates).map(([jobId, data]) => (
                    <div className="cmpd-jobwise-section" key={jobId}>
                      <div className="cmpd-jobwise-header">
                        <h3><Briefcase size={16} /> {data.title}</h3>
                        <span className="cmpd-jobwise-count">{data.applicants.length} applicant{data.applicants.length!==1? 's':''}</span>
                      </div>
                      <div className="cmpd-jobwise-cards">
                        {data.applicants.map((c) => (
                          <div className="cmpd-jobwise-card" key={c.id}>
                            <div className="cmpd-cand-name">
                              <div className="cmpd-cand-avatar">{(c.candidate?.name||'U').charAt(0).toUpperCase()}</div>
                              <div>
                                <div style={{fontWeight: 600}}>{c.candidate?.name||'Unknown'}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{c.candidate?.email||''}</div>
                              </div>
                            </div>
                            <div className="cmpd-jobwise-meta">
                              <span className={`cmpd-status-pill ${c.status}`}>{(c.status||'').replace('-', ' ')}</span>
                              {c.score>0&&<span className={`cmpd-score ${c.score>=80? 'high':c.score>=60? 'mid':'low'}`}>{c.score}%</span>}
                              <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{c.round||'Applied'}</span>
                            </div>
                            <div className="cmpd-actions-group" style={{marginTop: '8px'}}>
                              <button className="cmpd-action-btn" title="View"><Eye size={14} /> View</button>
                              {c.status!=='interview'&&c.status!=='rejected'&&(
                                <button className="cmpd-action-btn cmpd-action-schedule" onClick={() => handleScheduleInterview(c, jobId, c.id)} disabled={schedulingCandidate===c.candidate?.id}>
                                  <Video size={14} /> Schedule
                                </button>
                              )}
                              {c.status==='interview'&&<span className="cmpd-interview-scheduled-badge">📅 Scheduled</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* QUIZ TAB */}
          {activeTab==='quiz'&&(
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Live Quiz Management</h1>
                  <p>Create and manage quizzes for each hiring round</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button className="cmpd-btn-secondary" onClick={() => navigate('/quiz/dashboard')}>
                    <Settings size={16} /> Full Quiz Manager
                  </button>
                  <button className="cmpd-btn-primary" onClick={() => setShowCreateQuiz(true)}>
                    <Plus size={16} /> Create Quiz
                  </button>
                </div>
              </div>

              {/* Create Quiz Wizard Modal */}
              {showCreateQuiz&&(
                <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}} onClick={e => { if (e.target===e.currentTarget && !creatingQuiz && !generatingAI) resetQuizWizard(); }}>
                  <div style={{background: 'var(--bg-secondary, #1a1a2e)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '16px', padding: '28px', width: '94%', maxWidth: wizardStep===3? '720px':'520px', maxHeight: '88vh', overflowY: 'auto', transition: 'max-width 0.3s'}}>

                    {/* Step indicator */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'}}>
                      {[1,2,3].map(s => (
                        <div key={s} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <div style={{width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: wizardStep>=s? '#6366f1':'var(--bg-primary, #0f0f1a)', color: wizardStep>=s? '#fff':'#64748b', border: `2px solid ${wizardStep>=s? '#6366f1':'#334155'}`, transition: 'all 0.3s'}}>{wizardStep>s? '✓':s}</div>
                          <span style={{fontSize: '0.78rem', color: wizardStep===s? '#e2e8f0':'#64748b', fontWeight: wizardStep===s? 600:400}}>{s===1? 'Details':s===2? 'Questions':'Review'}</span>
                          {s<3&&<div style={{width: '30px', height: '2px', background: wizardStep>s? '#6366f1':'#334155', borderRadius: '1px'}} />}
                        </div>
                      ))}
                    </div>

                    {/* Error banner */}
                    {quizError&&(
                      <div style={{background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#fca5a5'}}>
                        <XCircle size={16} /> {quizError}
                        <button onClick={() => setQuizError('')} style={{marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer'}}><X size={14} /></button>
                      </div>
                    )}

                    {/* ─── Step 1: Quiz Details ─── */}
                    {wizardStep===1&&(
                      <>
                        <h2 style={{margin: '0 0 18px', fontSize: '1.25rem'}}>📝 Quiz Details</h2>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                          <div>
                            <label style={{fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>Title *</label>
                            <input value={quizForm.title} onChange={e => setQuizForm(f => ({...f, title: e.target.value}))} placeholder="e.g. JavaScript Fundamentals" style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box'}} />
                          </div>
                          <div>
                            <label style={{fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>Topic *</label>
                            <input value={quizForm.topic} onChange={e => setQuizForm(f => ({...f, topic: e.target.value}))} placeholder="e.g. React, Node.js, SQL, Data Structures..." style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box'}} />
                          </div>
                          <div>
                            <label style={{fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>Description</label>
                            <textarea value={quizForm.description} onChange={e => setQuizForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Optional description" style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'}} />
                          </div>
                          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px'}}>
                            <div>
                              <label style={{fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>Difficulty</label>
                              <select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({...f, difficulty: e.target.value}))} style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem'}}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                            <div>
                              <label style={{fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>Time/Q (sec)</label>
                              <input type="number" min={10} max={120} value={quizForm.questionTimeLimit} onChange={e => setQuizForm(f => ({...f, questionTimeLimit: Number(e.target.value)}))} style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box'}} />
                            </div>
                            <div>
                              <label style={{fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px'}}># Questions</label>
                              <input type="number" min={1} max={30} value={quizForm.questionCount} onChange={e => setQuizForm(f => ({...f, questionCount: Math.min(30, Math.max(1, Number(e.target.value)))}))} style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box'}} />
                            </div>
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end'}}>
                          <button className="cmpd-btn-secondary" onClick={resetQuizWizard}>Cancel</button>
                          <button className="cmpd-btn-primary" onClick={handleCreateQuizShell} disabled={creatingQuiz||!quizForm.title.trim()||!quizForm.topic.trim()}>
                            {creatingQuiz? <><Loader size={14} style={{animation: 'spin 1s linear infinite'}} /> Creating...</>:'Next → Add Questions'}
                          </button>
                        </div>
                      </>
                    )}

                    {/* ─── Step 2: Generate / Add Questions ─── */}
                    {wizardStep===2&&(
                      <>
                        <h2 style={{margin: '0 0 6px', fontSize: '1.25rem'}}>🧠 Add Questions</h2>
                        <p style={{color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px'}}>Choose how to add questions to your quiz</p>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                          {/* AI Generate Card */}
                          <div
                            onClick={!generatingAI? handleAIGenerate:undefined}
                            style={{background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '2px solid rgba(99,102,241,0.3)', borderRadius: '14px', padding: '24px', cursor: generatingAI? 'wait':'pointer', textAlign: 'center', transition: 'all 0.2s'}}
                            onMouseEnter={e => { if (!generatingAI) e.currentTarget.style.borderColor='#6366f1'; }}
                            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'}
                          >
                            {generatingAI? (
                              <>
                                <Loader size={36} style={{color: '#818cf8', marginBottom: '12px', animation: 'spin 1s linear infinite'}} />
                                <h3 style={{fontSize: '1rem', margin: '0 0 6px', color: '#c4b5fd'}}>AI is thinking...</h3>
                                <p style={{fontSize: '0.8rem', color: '#94a3b8', margin: 0}}>Generating {quizForm.questionCount} {quizForm.difficulty} questions about {quizForm.topic}</p>
                              </>
                            ):(
                              <>
                                <Sparkles size={36} style={{color: '#818cf8', marginBottom: '12px'}} />
                                <h3 style={{fontSize: '1rem', margin: '0 0 6px'}}>✨ Generate with AI</h3>
                                <p style={{fontSize: '0.8rem', color: '#94a3b8', margin: 0}}>{quizForm.questionCount} MCQ questions about "{quizForm.topic}" • {quizForm.difficulty}</p>
                              </>
                            )}
                          </div>

                          {/* Manual / Quiz Dashboard Card */}
                          <div
                            onClick={() => { resetQuizWizard(); navigate('/quiz/dashboard'); }}
                            style={{background: 'var(--bg-primary, #0f0f1a)', border: '2px solid var(--border-color, #2a2a3a)', borderRadius: '14px', padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'}}
                            onMouseEnter={e => e.currentTarget.style.borderColor='#6366f1'}
                            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-color, #2a2a3a)'}
                          >
                            <FileText size={36} style={{color: '#64748b', marginBottom: '12px'}} />
                            <h3 style={{fontSize: '1rem', margin: '0 0 6px'}}>Add Manually</h3>
                            <p style={{fontSize: '0.8rem', color: '#94a3b8', margin: 0}}>Open the quiz editor to type your own questions</p>
                          </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                          <button className="cmpd-btn-secondary" onClick={resetQuizWizard}>Cancel</button>
                        </div>
                      </>
                    )}

                    {/* ─── Step 3: Review AI Questions ─── */}
                    {wizardStep===3&&(
                      <>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                          <div>
                            <h2 style={{margin: '0 0 4px', fontSize: '1.25rem'}}>✅ Review Questions ({generatedQuestions.length})</h2>
                            <p style={{color: '#94a3b8', fontSize: '0.82rem', margin: 0}}>Review, remove unwanted questions, or generate more</p>
                          </div>
                          <button
                            className="cmpd-btn-secondary"
                            onClick={handleAIGenerate}
                            disabled={generatingAI}
                            style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem'}}
                          >
                            {generatingAI? <Loader size={14} style={{animation: 'spin 1s linear infinite'}} />:<RefreshCw size={14} />}
                            {generatingAI? 'Generating...':'+ Generate More'}
                          </button>
                        </div>

                        <div style={{maxHeight: '42vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px'}}>
                          {generatedQuestions.map((q, i) => (
                            <div key={i} style={{background: 'var(--bg-primary, #0f0f1a)', border: '1px solid var(--border-color, #2a2a3a)', borderRadius: '10px', padding: '14px'}}>
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px'}}>
                                <span style={{fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0}}>Q{i+1}.</span>
                                <p style={{fontSize: '0.88rem', color: '#e2e8f0', margin: 0, flex: 1}}>{q.text}</p>
                                <button onClick={() => removeQuestion(i)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', flexShrink: 0, padding: '2px'}}><Trash2 size={14} /></button>
                              </div>
                              {q.options&&q.options.length>0&&(
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px', marginLeft: '28px'}}>
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} style={{fontSize: '0.8rem', padding: '6px 10px', borderRadius: '6px', background: opt===q.correctAnswer? 'rgba(34,197,94,0.12)':'rgba(148,163,184,0.06)', color: opt===q.correctAnswer? '#86efac':'#94a3b8', border: `1px solid ${opt===q.correctAnswer? 'rgba(34,197,94,0.3)':'transparent'}`}}>
                                      {String.fromCharCode(65+oi)}. {opt} {opt===q.correctAnswer&&<Check size={12} style={{marginLeft: '4px', verticalAlign: 'middle'}} />}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {q.explanation&&<p style={{fontSize: '0.75rem', color: '#64748b', margin: '8px 0 0 28px', fontStyle: 'italic'}}>💡 {q.explanation}</p>}
                            </div>
                          ))}
                        </div>

                        <div style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                          <button className="cmpd-btn-secondary" onClick={resetQuizWizard} style={{marginRight: 'auto'}}>Cancel</button>
                          <button className="cmpd-btn-secondary" onClick={() => handleFinishQuiz(false)} disabled={creatingQuiz||generatedQuestions.length===0}>
                            {creatingQuiz? 'Saving...':'Save as Draft'}
                          </button>
                          <button className="cmpd-btn-primary" onClick={() => handleFinishQuiz(true)} disabled={creatingQuiz||generatedQuestions.length===0} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {creatingQuiz? <><Loader size={14} style={{animation: 'spin 1s linear infinite'}} /> Publishing...</>:<><Zap size={14} /> Publish & Go Live</>}
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}

              <div className="cmpd-quiz-grid">
                {loadingQuizzes? (
                  <div style={{padding: '40px', textAlign: 'center', color: '#737373', gridColumn: '1 / -1'}}>Loading quizzes...</div>
                ):quizzes.length===0? (
                  <div style={{padding: '40px', textAlign: 'center', color: '#737373', gridColumn: '1 / -1'}}>
                    <Zap size={40} style={{marginBottom: 12, opacity: 0.3}} />
                    <h3 style={{color: '#a3a3a3'}}>No quizzes created yet</h3>
                    <p>Click "Create Quiz" to set up a live quiz round for candidates</p>
                  </div>
                ):quizzes.map((q) => (
                  <div className="cmpd-quiz-card" key={q.id||q._id}>
                    <div className="cmpd-quiz-top">
                      <div className="cmpd-quiz-icon"><Zap size={20} /></div>
                      <span className={`cmpd-status-pill ${q.status}`}>{q.status}</span>
                    </div>
                    <h3>{q.title}</h3>
                    <span className="cmpd-quiz-round">{q.topic} · {q.difficulty}</span>
                    <div className="cmpd-quiz-meta">
                      <span><FileText size={13} /> {q.questionCount} questions</span>
                      <span><Timer size={13} /> {q.questionTimeLimit}s/Q</span>
                      <span><Users size={13} /> {q.participantCount} joined</span>
                    </div>
                    <div style={{fontSize: '0.78rem', color: '#818cf8', fontFamily: 'monospace', margin: '6px 0'}}>Room: {q.code}</div>
                    <div className="cmpd-quiz-actions">
                      {q.status==='draft'&&(
                        <>
                          <button className="cmpd-btn-secondary cmpd-btn-sm" onClick={() => navigate('/quiz/dashboard')}><Settings size={14} /> Edit</button>
                          {q.questionCount>0&&<button className="cmpd-btn-primary cmpd-btn-sm" onClick={async () => { try { await fetch(`${import.meta.env.VITE_API_URL||'http://localhost:5000'}/api/quiz/${q.id}/publish`, {method:'POST',credentials:'include'}); fetchCompanyQuizzes(); } catch {} }}>Publish</button>}
                        </>
                      )}
                      {q.status==='waiting'&&(
                        <button className="cmpd-btn-primary cmpd-btn-sm" onClick={() => navigate(`/quiz/host/${q.id}`)}><PlayCircle size={14} /> Open Lobby</button>
                      )}
                      {['active','question_open','question_closed'].includes(q.status)&&(
                        <button className="cmpd-btn-primary cmpd-btn-sm" onClick={() => navigate(`/quiz/host/${q.id}`)}><PlayCircle size={14} /> Rejoin Live</button>
                      )}
                      {q.status==='completed'&&(
                        <button className="cmpd-btn-secondary cmpd-btn-sm" onClick={() => navigate(`/quiz/results/${q.id}`)}><BarChart3 size={14} /> View Results</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* INTERVIEWS TAB */}
          {activeTab==='interviews'&&(
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Interview Management</h1>
                  <p>Schedule and conduct live interviews with proctoring</p>
                </div>
                <button className="cmpd-btn-primary" onClick={handleStartInterview} disabled={startingInterview}>
                  <Video size={16} /> {startingInterview? 'Starting...':'Quick Start Interview'}
                </button>
              </div>

              {/* Scheduled Interviews Table */}
              <div className="cmpd-table-card" style={{marginBottom: '1.5rem'}}>
                <div className="cmpd-card-header" style={{padding: '14px 20px', borderBottom: '1px solid var(--border-color, #2a2a3a)'}}>
                  <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}><Video size={18} /> Scheduled Interviews ({scheduledInterviews.length})</h3>
                </div>
                {scheduledInterviews.length===0? (
                  <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-muted, #888)'}}>
                    <Calendar size={32} style={{marginBottom: '8px', opacity: 0.5}} />
                    <p>No scheduled interviews yet</p>
                    <p style={{fontSize: '0.8rem'}}>Go to <strong>Candidates</strong> tab → select a job → click <strong>Schedule</strong> on any applicant</p>
                  </div>
                ):(
                  <table className="cmpd-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job</th>
                        <th>Scheduled</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledInterviews.map((iv) => (
                        <tr key={iv.sessionId}>
                          <td>
                            <div className="cmpd-cand-name">
                              <div className="cmpd-cand-avatar">{(iv.candidateName||'?').charAt(0).toUpperCase()}</div>
                              <div>
                                <div>{iv.candidateName}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{iv.candidateEmail||''}</div>
                              </div>
                            </div>
                          </td>
                          <td>{iv.jobTitle||'—'}</td>
                          <td style={{fontSize: '0.85rem'}}>{iv.scheduledAt? new Date(iv.scheduledAt).toLocaleString():'—'}</td>
                          <td>{iv.duration||30} min</td>
                          <td><span className={`cmpd-status-pill ${iv.status}`}>{iv.status}</span></td>
                          <td>
                            <div className="cmpd-actions-group">
                              {(iv.status==='scheduled'||iv.status==='active')&&(
                                <button className="cmpd-action-btn cmpd-action-schedule" onClick={() => handleJoinAsRecruiter(iv.sessionId)}>
                                  <PlayCircle size={14} /> Join
                                </button>
                              )}
                              <button className="cmpd-action-btn" onClick={() => handleCopyLink(iv.sessionId)} title="Copy link for candidate">
                                {copiedLink===iv.sessionId? <><CheckCircle2 size={14} /> Copied</>:<><Eye size={14} /> Copy Link</>}
                              </button>
                              {iv.status==='completed'&&(
                                <button className="cmpd-action-btn" onClick={() => navigate(`/interview-report/${iv.sessionId}?role=recruiter`)}>
                                  <FileText size={14} /> Report
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="cmpd-interview-grid">
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
          {activeTab==='reports'&&(
            <>
              <div className="cmpd-welcome">
                <div>
                  <h1>Analytics & Reports</h1>
                  <p>Real-time hiring metrics from your data</p>
                </div>
              </div>

              {/* KPI Row — real stats */}
              <div className="cmpd-stats-row" style={{marginBottom: '1.5rem'}}>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{color: '#3b82f6', background: '#3b82f615'}}><Users size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">TOTAL APPLICATIONS</span>
                    <span className="cmpd-stat-value">{companyStats.totalApplicants}</span>
                    <span className="cmpd-stat-change">across {jobs.length} job{jobs.length!==1? 's':''}</span>
                  </div>
                </div>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{color: '#a855f7', background: '#a855f715'}}><Video size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">IN INTERVIEW</span>
                    <span className="cmpd-stat-value">{companyStats.inInterview}</span>
                    <span className="cmpd-stat-change">{scheduledInterviews.length} scheduled</span>
                  </div>
                </div>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{color: '#22c55e', background: '#22c55e15'}}><Award size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">OFFERED</span>
                    <span className="cmpd-stat-value">{companyStats.offered}</span>
                    <span className="cmpd-stat-change">{companyStats.hired} hired</span>
                  </div>
                </div>
                <div className="cmpd-stat-card">
                  <div className="cmpd-stat-icon" style={{color: '#eab308', background: '#eab30815'}}><TrendingUp size={20} /></div>
                  <div className="cmpd-stat-info">
                    <span className="cmpd-stat-label">HIRE RATE</span>
                    <span className="cmpd-stat-value">{companyStats.totalApplicants>0? `${Math.round((companyStats.hired/companyStats.totalApplicants)*100)}%`:'0%'}</span>
                    <span className="cmpd-stat-change">applicant → hire</span>
                  </div>
                </div>
              </div>

              {/* Hiring Funnel — real data */}
              <div className="cmpd-analytics-row">
                <div className="cmpd-card cmpd-analytics-card" style={{flex: 1}}>
                  <div className="cmpd-card-header">
                    <h3><Activity size={18} /> Hiring Funnel</h3>
                  </div>
                  <div className="cmpd-card-body" style={{padding: '1.5rem'}}>
                    {companyStats.totalApplicants===0? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#737373'}}>No data yet — applicants will populate the funnel</div>
                    ):(
                      <div className="cmpd-funnel">
                        {[
                          {stage: 'Applied', count: companyStats.totalApplicants, color: '#3b82f6'},
                          {stage: 'Interview', count: companyStats.inInterview, color: '#a855f7'},
                          {stage: 'Offered', count: companyStats.offered, color: '#22c55e'},
                          {stage: 'Hired', count: companyStats.hired, color: '#eab308'},
                        ].map((s) =>
                        {
                          const pct=companyStats.totalApplicants>0? Math.round((s.count/companyStats.totalApplicants)*100):0;
                          return (
                            <div className="cmpd-funnel-row" key={s.stage}>
                              <span className="cmpd-funnel-label">{s.stage}</span>
                              <div className="cmpd-funnel-track">
                                <div className="cmpd-funnel-fill" style={{width: `${Math.max(pct, 3)}%`, background: s.color}} />
                              </div>
                              <span className="cmpd-funnel-count">{s.count}</span>
                              <span className="cmpd-funnel-pct">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Job-wise applicant distribution */}
                <div className="cmpd-card cmpd-analytics-card" style={{flex: 1}}>
                  <div className="cmpd-card-header">
                    <h3><Briefcase size={18} /> Applicants per Job</h3>
                  </div>
                  <div className="cmpd-card-body" style={{padding: '1.5rem'}}>
                    {jobs.length===0? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#737373'}}>No jobs posted yet</div>
                    ):(
                      <div className="cmpd-horizontal-bars">
                        {jobs.slice(0, 8).map((j) =>
                        {
                          const maxApps=Math.max(...jobs.map(jj => jj.applicantCount||0), 1);
                          return (
                            <div className="cmpd-h-bar-row" key={j.id||j._id}>
                              <div className="cmpd-h-bar-info">
                                <span className="cmpd-h-bar-label">{j.title.substring(0, 25)}{j.title.length>25? '…':''}</span>
                                <span className="cmpd-h-bar-value">{j.applicantCount||0}</span>
                              </div>
                              <div className="cmpd-h-bar-track">
                                <div className="cmpd-h-bar-fill" style={{width: `${((j.applicantCount||0)/maxApps)*100}%`, background: '#6366f1'}} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Reports — real numbers */}
              <div className="cmpd-reports-grid" style={{marginTop: '1.25rem'}}>
                <div className="cmpd-report-card">
                  <div className="cmpd-report-icon" style={{background: '#3b82f615', color: '#3b82f6'}}><Percent size={28} /></div>
                  <h3>Conversion Rates</h3>
                  <p>Real pipeline metrics</p>
                  <div className="cmpd-report-preview">
                    <div className="cmpd-mini-stat"><strong>{companyStats.totalApplicants>0? `${Math.round((companyStats.inInterview/companyStats.totalApplicants)*100)}%`:'—'}</strong><span>Interview Rate</span></div>
                    <div className="cmpd-mini-stat"><strong>{companyStats.totalApplicants>0? `${Math.round((companyStats.offered/companyStats.totalApplicants)*100)}%`:'—'}</strong><span>Offer Rate</span></div>
                    <div className="cmpd-mini-stat"><strong>{companyStats.totalApplicants>0? `${Math.round((companyStats.hired/companyStats.totalApplicants)*100)}%`:'—'}</strong><span>Hire Rate</span></div>
                  </div>
                </div>

                <div className="cmpd-report-card">
                  <div className="cmpd-report-icon" style={{background: '#a855f715', color: '#a855f7'}}><Briefcase size={28} /></div>
                  <h3>Job Overview</h3>
                  <p>Active postings summary</p>
                  <div className="cmpd-report-preview">
                    <div className="cmpd-mini-stat"><strong>{companyStats.activeJobs}</strong><span>Active Jobs</span></div>
                    <div className="cmpd-mini-stat"><strong>{jobs.length}</strong><span>Total Posted</span></div>
                    <div className="cmpd-mini-stat"><strong>{scheduledInterviews.length}</strong><span>Interviews</span></div>
                  </div>
                </div>

                <div className="cmpd-report-card">
                  <div className="cmpd-report-icon" style={{background: '#22c55e15', color: '#22c55e'}}><TrendingUp size={28} /></div>
                  <h3>Pipeline Summary</h3>
                  <p>End-to-end hiring flow</p>
                  <div className="cmpd-report-preview">
                    <div className="cmpd-mini-stat"><strong>{companyStats.totalApplicants}</strong><span>Applicants</span></div>
                    <div className="cmpd-mini-stat"><strong>{companyStats.offered}</strong><span>Offers</span></div>
                    <div className="cmpd-mini-stat"><strong>{companyStats.hired}</strong><span>Hired</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Post Job Modal ─────────────────────────────────── */}
      {showPostJobModal&&(
        <div className="cmpd-modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="cmpd-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Post New Job</h2>
            <p className="cmpd-modal-sub">Fill in the details to create a new job listing</p>

            <div className="cmpd-form-group">
              <label>Job Title</label>
              <input value={jobForm.title} onChange={(e) => setJobForm({...jobForm, title: e.target.value})} placeholder="e.g. Senior React Developer" />
            </div>

            <div className="cmpd-form-row">
              <div className="cmpd-form-group">
                <label>Department</label>
                <input value={jobForm.department} onChange={(e) => setJobForm({...jobForm, department: e.target.value})} placeholder="e.g. Engineering" />
              </div>
              <div className="cmpd-form-group">
                <label>Location</label>
                <select value={jobForm.location} onChange={(e) => setJobForm({...jobForm, location: e.target.value})}>
                  <option>Remote</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            <div className="cmpd-form-group">
              <label>Job Type</label>
              <select value={jobForm.type} onChange={(e) => setJobForm({...jobForm, type: e.target.value})}>
                <option>Full-Time</option>
                <option>Part-Time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>

            <div className="cmpd-form-group">
              <label>Description</label>
              <textarea value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} placeholder="Job description..." rows={4}></textarea>
            </div>

            <div className="cmpd-form-group">
              <label>Requirements</label>
              <textarea value={jobForm.requirements} onChange={(e) => setJobForm({...jobForm, requirements: e.target.value})} placeholder="Key requirements..." rows={3}></textarea>
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
