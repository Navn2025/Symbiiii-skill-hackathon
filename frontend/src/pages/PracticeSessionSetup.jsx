import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import './PracticeSessionSetup.css';

function PracticeSessionSetup()
{
    const navigate=useNavigate();
    const [config, setConfig]=useState({
        role: '',
        difficulty: 'medium',
        interviewType: 'technical',
        mode: 'quick', // quick, real, coding
        duration: 20,
    });

    const roles=[
        {id: 'frontend', name: 'Frontend Developer', icon: '🎨'},
        {id: 'backend', name: 'Backend Developer', icon: '⚙️'},
        {id: 'fullstack', name: 'Full Stack Developer', icon: '🚀'},
        {id: 'data-science', name: 'Data Scientist', icon: '📊'},
        {id: 'devops', name: 'DevOps Engineer', icon: '🔧'},
        {id: 'mobile', name: 'Mobile Developer', icon: '📱'},
    ];

    const interviewTypes=[
        {id: 'technical', name: 'Technical Interview', desc: 'Technical concepts and problem solving', icon: '💻'},
        {id: 'behavioral', name: 'Behavioral Interview', desc: 'Behavioral questions and soft skills', icon: '💬'},
        {id: 'coding', name: 'Coding Round', desc: 'Live coding challenges', icon: '⌨️'},
        {id: 'system-design', name: 'System Design', desc: 'Architecture and design discussions', icon: '🏗️'},
    ];

    const modes=[
        {
            id: 'quick',
            name: 'Quick Practice',
            desc: '5 questions, 10-15 min',
            features: ['Fast feedback', 'No strict scoring', 'Basic evaluation'],
            duration: 15,
            icon: '⚡',
        },
        {
            id: 'real',
            name: 'Real Interview Simulation',
            desc: '10-15 questions, 30-40 min',
            features: ['Timed session', 'Adaptive difficulty', 'Detailed scorecard', 'Follow-up questions'],
            duration: 35,
            icon: '🎯',
        },
        {
            id: 'coding',
            name: 'Coding Challenge',
            desc: '2-3 problems, 45-60 min',
            features: ['Code editor', 'Run & test', 'Time complexity analysis', 'Code quality review'],
            duration: 50,
            icon: '👨‍💻',
        },
    ];

    const handleStartPractice=async () =>
    {
        if (!config.role)
        {
            alert('Please select a role');
            return;
        }

        // Create practice session
        const sessionId=`practice-${Date.now()}`;
        const sessionData={
            ...config,
            sessionId,
            startTime: new Date().toISOString(),
        };

        // Store in localStorage
        localStorage.setItem('practiceSession', JSON.stringify(sessionData));

        // Navigate to practice interview room
        navigate(`/practice-interview/${sessionId}?role=${config.role}&difficulty=${config.difficulty}&type=${config.interviewType}&mode=${config.mode}`);
    };

    return (
        <div className="practice-setup">
            <div className="setup-container">
                <div className="setup-header">
                    <h1>🎯 AI Interview Practice</h1>
                    <p>Practice with AI-powered interviews tailored to your needs</p>
                </div>

                {/* Step 1: Select Role */}
                <section className="setup-section">
                    <h2>1️⃣ Select Your Target Role</h2>
                    <div className="role-grid">
                        {roles.map(role => (
                            <div
                                key={role.id}
                                className={`role-card ${config.role===role.id? 'selected':''}`}
                                onClick={() => setConfig({...config, role: role.id})}
                            >
                                <div className="role-icon">{role.icon}</div>
                                <div className="role-name">{role.name}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Step 2: Select Interview Type */}
                <section className="setup-section">
                    <h2>2️⃣ Choose Interview Type</h2>
                    <div className="type-grid">
                        {interviewTypes.map(type => (
                            <div
                                key={type.id}
                                className={`type-card ${config.interviewType===type.id? 'selected':''}`}
                                onClick={() => setConfig({...config, interviewType: type.id})}
                            >
                                <div className="type-icon">{type.icon}</div>
                                <h3>{type.name}</h3>
                                <p>{type.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Step 3: Select Difficulty */}
                <section className="setup-section">
                    <h2>3️⃣ Select Difficulty Level</h2>
                    <div className="difficulty-selector">
                        <button
                            className={`difficulty-btn easy ${config.difficulty==='easy'? 'selected':''}`}
                            onClick={() => setConfig({...config, difficulty: 'easy'})}
                        >
                            <span className="diff-icon">😊</span>
                            <span className="diff-name">Easy</span>
                            <span className="diff-desc">Entry level questions</span>
                        </button>
                        <button
                            className={`difficulty-btn medium ${config.difficulty==='medium'? 'selected':''}`}
                            onClick={() => setConfig({...config, difficulty: 'medium'})}
                        >
                            <span className="diff-icon">😐</span>
                            <span className="diff-name">Medium</span>
                            <span className="diff-desc">Intermediate concepts</span>
                        </button>
                        <button
                            className={`difficulty-btn hard ${config.difficulty==='hard'? 'selected':''}`}
                            onClick={() => setConfig({...config, difficulty: 'hard'})}
                        >
                            <span className="diff-icon">😤</span>
                            <span className="diff-name">Hard</span>
                            <span className="diff-desc">Advanced challenges</span>
                        </button>
                    </div>
                </section>

                {/* Step 4: Select Mode */}
                <section className="setup-section">
                    <h2>4️⃣ Choose Practice Mode</h2>
                    <div className="mode-grid">
                        {modes.map(mode => (
                            <div
                                key={mode.id}
                                className={`mode-card ${config.mode===mode.id? 'selected':''}`}
                                onClick={() => setConfig({...config, mode: mode.id, duration: mode.duration})}
                            >
                                <div className="mode-icon">{mode.icon}</div>
                                <h3>{mode.name}</h3>
                                <p className="mode-desc">{mode.desc}</p>
                                <ul className="mode-features">
                                    {mode.features.map((feature, i) => (
                                        <li key={i}>✓ {feature}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Summary and Start */}
                <section className="setup-summary">
                    <div className="summary-box">
                        <h3>Session Summary</h3>
                        <div className="summary-details">
                            <div className="summary-item">
                                <strong>Role:</strong>
                                <span>{roles.find(r => r.id===config.role)?.name||'Not selected'}</span>
                            </div>
                            <div className="summary-item">
                                <strong>Type:</strong>
                                <span>{interviewTypes.find(t => t.id===config.interviewType)?.name}</span>
                            </div>
                            <div className="summary-item">
                                <strong>Difficulty:</strong>
                                <span className={`badge-${config.difficulty}`}>{config.difficulty}</span>
                            </div>
                            <div className="summary-item">
                                <strong>Mode:</strong>
                                <span>{modes.find(m => m.id===config.mode)?.name}</span>
                            </div>
                            <div className="summary-item">
                                <strong>Duration:</strong>
                                <span>~{config.duration} minutes</span>
                            </div>
                        </div>
                    </div>
                    <button
                        className="start-btn"
                        onClick={handleStartPractice}
                        disabled={!config.role}
                    >
                        🚀 Start Practice Interview
                    </button>
                </section>
            </div>
        </div>
    );
}

export default PracticeSessionSetup;
