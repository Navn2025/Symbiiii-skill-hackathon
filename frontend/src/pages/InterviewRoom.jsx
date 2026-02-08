import {useState, useEffect, useRef} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import socketService from '../services/socket';
import proctoringService from '../services/proctoring';
import {getInterview, getQuestion, executeCode, submitCode} from '../services/api';
import CodeEditor from '../components/CodeEditor';
import VideoPanel from '../components/VideoPanel';
import ProctoringMonitor from '../components/ProctoringMonitor';
import SecondaryCamera from '../components/SecondaryCamera';
import ChatPanel from '../components/ChatPanel';
import QuestionPanel from '../components/QuestionPanel';
import QuestionSelector from '../components/QuestionSelector';
import {Target as TargetIcon, FileText as DocumentIcon, Lock as LockIcon, MessageCircle as ChatIcon, AlertCircle as AlertIcon, Beaker as BeakerIcon, Play as PlayIcon, Check as CheckIcon} from 'lucide-react';
import './InterviewRoom.css';

function InterviewRoom()
{
    const {interviewId}=useParams();
    const [searchParams]=useSearchParams();
    const mode=searchParams.get('mode');
    const userName=searchParams.get('name');
    const role=searchParams.get('role');

    const [interview, setInterview]=useState(null);
    const [currentQuestion, setCurrentQuestion]=useState(null);
    const [showQuestionSelector, setShowQuestionSelector]=useState(false);
    const [code, setCode]=useState('');
    const [language, setLanguage]=useState('javascript');
    const [output, setOutput]=useState('');
    const [loading, setLoading]=useState(false);
    const [showChat, setShowChat]=useState(false);
    const [proctoringEvents, setProctoringEvents]=useState([]);
    const [suspicionScore, setSuspicionScore]=useState(0);
    const [integrityScore, setIntegrityScore]=useState(100);
    const [securityAlert, setSecurityAlert]=useState(null);
    const videoRef=useRef(null);

    useEffect(() =>
    {
        // Load interview
        loadInterview();

        // Connect socket
        const socket=socketService.connect();
        socketService.joinInterview(interviewId, userName, role);

        // Listen for code updates
        socket.on('code-update', (data) =>
        {
            setCode(data.code);
            setLanguage(data.language);
        });

        // Listen for question updates (from interviewer)
        socket.on('question-update', (data) =>
        {
            console.log('Question updated:', data.question);
            setCurrentQuestion(data.question);
            setCode(data.question.starterCode?.[language]||'');
        });

        // Listen for proctoring alerts
        socket.on('proctoring-alert', (data) =>
        {
            console.log('Live proctoring alert received:', data.event);
            setProctoringEvents(prev => [...prev, data.event]);

            // Update scores based on severity
            const scoreImpact={
                low: 5,
                medium: 10,
                high: 20,
                critical: 30,
            };

            setSuspicionScore(prev =>
            {
                const newScore=Math.min(100, prev+(scoreImpact[data.event.severity]||10));
                setIntegrityScore(Math.max(0, 100-newScore));
                return newScore;
            });

            showSecurityAlert(data.event);
        });

        // Show security warning on load
        if (role==='candidate')
        {
            setTimeout(() =>
            {
                alert('SECURITY NOTICE\n\n'+
                    'This interview is being monitored for integrity:\n\n'+
                    'Face detection active\n'+
                    'Eye tracking and gaze monitoring\n'+
                    'Tab switching monitored\n'+
                    'Fullscreen enforced\n'+
                    'Copy-paste disabled\n'+
                    'AI-generated code detection\n'+
                    'Multiple faces detection\n'+
                    'Secondary camera required (use your phone)\n\n'+
                    'Violations will be reported and may result in interview termination.\n\n'+
                    'Click OK to accept and continue.');
            }, 1000);
        }

        return () =>
        {
            socketService.leaveInterview(interviewId);
            proctoringService.stopMonitoring();
        };
    }, [interviewId, userName, role]);

    const loadInterview=async () =>
    {
        try
        {
            const response=await getInterview(interviewId);
            setInterview(response.data);

            // Load first question (only for candidates - recruiters will select)
            if (role==='candidate')
            {
                const questionResponse=await getQuestion('1');
                setCurrentQuestion(questionResponse.data);
                setCode(questionResponse.data.starterCode[language]);
            } else
            {
                // Show question selector for recruiters
                setShowQuestionSelector(true);
            }

            // Register session with proctoring backend
            if (role==='candidate')
            {
                try
                {
                    await fetch(`${import.meta.env.VITE_API_URL||'http://localhost:5000'}/api/proctoring/session`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            interviewId,
                            candidateName: userName,
                            candidateEmail: searchParams.get('email')||'',
                            recruiterName: response.data?.recruiterName||'Unknown',
                            startTime: new Date(),
                        }),
                    });
                    console.log('Session registered with proctor dashboard');
                } catch (error)
                {
                    console.error('Failed to register session:', error);
                }
            }
        } catch (error)
        {
            console.error('Error loading interview:', error);
        }
    };

    const handleQuestionSelected=(question) =>
    {
        console.log('Question selected:', question);
        setCurrentQuestion(question);
        setCode(question.starterCode?.[language]||'');
        setShowQuestionSelector(false);

        // Broadcast question change to candidate via socket
        const socket=socketService.getSocket();
        if (socket)
        {
            socket.emit('question-update', {
                interviewId,
                question,
            });
        }
    };

    const handleChangeQuestion=() =>
    {
        if (role==='recruiter')
        {
            setShowQuestionSelector(true);
        }
    };

    // Handle video stream ready - start proctoring
    const handleVideoReady=async (stream) =>
    {
        console.log('Video ready callback triggered');
        console.log('Role:', role);
        console.log('VideoRef:', videoRef);
        console.log('VideoRef.current:', videoRef.current);

        if (role==='candidate'&&videoRef.current)
        {
            try
            {
                console.log('Attempting to start proctoring...');
                await proctoringService.startMonitoring(
                    videoRef.current,
                    interviewId,
                    handleViolationDetected,
                    socketService
                );
                console.log('Proctoring started successfully');
            } catch (error)
            {
                console.error('Failed to start proctoring:', error);
                // Don't alert - proctoring might still work partially
                console.warn('Warning: Some proctoring features may not work. Error:', error.message);
            }
        } else
        {
            console.log('Skipping proctoring - role:', role, 'videoRef.current:', videoRef.current);
        }
    };

    // Handle violation detected
    const handleViolationDetected=(violation, newSuspicionScore) =>
    {
        console.log('Violation detected:', violation);
        console.log('New suspicion score:', newSuspicionScore);

        setProctoringEvents(prev => [...prev, violation]);
        setSuspicionScore(newSuspicionScore);
        setIntegrityScore(Math.max(0, 100-newSuspicionScore));

        // Show alert for critical violations
        if (violation.severity==='critical')
        {
            showSecurityAlert(violation);
        }
    };

    // Show security alert
    const showSecurityAlert=(violation) =>
    {
        setSecurityAlert(violation);
        setTimeout(() => setSecurityAlert(null), 5000);
    };

    const handleCodeChange=(newCode) =>
    {
        setCode(newCode);
        // Send code update to other participants
        socketService.sendCodeUpdate(interviewId, newCode, language);
    };

    const handleLanguageChange=(newLanguage) =>
    {
        setLanguage(newLanguage);
        if (currentQuestion)
        {
            setCode(currentQuestion.starterCode[newLanguage]||'');
        }
    };

    const handleRunCode=async () =>
    {
        setLoading(true);
        try
        {
            const response=await executeCode({code, language});
            setOutput(response.data.output||'No output');
        } catch (error)
        {
            setOutput('Error executing code');
        } finally
        {
            setLoading(false);
        }
    };

    const handleSubmitCode=async () =>
    {
        setLoading(true);
        try
        {
            const response=await submitCode({
                code,
                language,
                questionId: currentQuestion.id,
            });

            const results=response.data;
            const summary=`Test Results: ${results.passed}/${results.total} passed\n\n`+
                results.results.map((r, i) =>
                    `Test Case ${i+1}: ${r.passed? '✓ Passed':'✗ Failed'}\n`+
                    `Expected: ${r.expected}\nActual: ${r.actual}\nRuntime: ${r.runtime}`
                ).join('\n\n');

            setOutput(summary);
        } catch (error)
        {
            setOutput('Error submitting code');
        } finally
        {
            setLoading(false);
        }
    };

    return (
        <div className="interview-room">
            {/* Question Selector Modal (for recruiters) */}
            {showQuestionSelector&&role==='recruiter'&&(
                <QuestionSelector
                    onQuestionSelected={handleQuestionSelected}
                    onClose={() => setShowQuestionSelector(false)}
                />
            )}

            {/* Security Alert Overlay */}
            {securityAlert&&(
                <div className={`security-alert security-alert-${securityAlert.severity}`}>
                    <div className="security-alert-content">
                        <span className="security-alert-icon"><AlertIcon size={24} /></span>
                        <div>
                            <strong>SECURITY VIOLATION</strong>
                            <p>{securityAlert.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Integrity Score Display for Candidate */}
            {role==='candidate'&&(
                <div className="integrity-score-badge">
                    <span className="integrity-label">Integrity Score:</span>
                    <span className={`integrity-value ${integrityScore<50? 'text-danger':integrityScore<80? 'text-warning':'text-success'}`}>
                        {integrityScore}/100
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="interview-header">
                <div className="interview-info">
                    <h2><TargetIcon size={20} /> Interview Room</h2>
                    <span className="interview-id">ID: {interviewId?.substring(0, 8)}</span>
                    <span className="badge badge-easy">{mode} mode</span>
                    {role==='candidate'&&(
                        <span className="badge badge-secure"><LockIcon size={14} /> Monitored</span>
                    )}
                </div>
                <div className="interview-controls">
                    {role==='recruiter'&&(
                        <button
                            className="btn btn-primary"
                            onClick={handleChangeQuestion}
                            title="Change or select a new question"
                        >
                            <DocumentIcon size={16} /> Change Question
                        </button>
                    )}
                    {role==='candidate'&&(
                        <button
                            className="btn btn-warning"
                            onClick={() =>
                            {
                                const testViolation={
                                    type: 'test',
                                    severity: 'low',
                                    description: 'Test violation - System is working!',
                                    timestamp: new Date().toISOString()
                                };
                                handleViolationDetected(testViolation, suspicionScore+5);
                            }}
                            title="Test proctoring system"
                        >
                            <BeakerIcon size={16} /> Test Alert
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setShowChat(!showChat)}>
                        <ChatIcon size={16} /> Chat
                    </button>
                    <button className="btn btn-danger">
                        End Interview
                    </button>
                </div>
            </div>

            <div className="interview-content">
                {/* Left Panel - Video & Proctoring */}
                <div className="left-panel">
                    <VideoPanel
                        interviewId={interviewId}
                        userName={userName}
                        role={role}
                        videoRef={videoRef}
                        onVideoReady={handleVideoReady}
                    />

                    {/* Secondary Camera Setup (for candidates) */}
                    {role==='candidate'&&(
                        <SecondaryCamera
                            interviewId={interviewId}
                            userName={userName}
                            isPhone={false}
                        />
                    )}

                    {mode==='recruiter'&&role==='recruiter'&&(
                        <ProctoringMonitor
                            interviewId={interviewId}
                            suspicionScore={suspicionScore}
                            integrityScore={integrityScore}
                        />
                    )}
                </div>

                {/* Middle Panel - Question & Code Editor */}
                <div className="middle-panel">
                    {currentQuestion? (
                        <QuestionPanel question={currentQuestion} />
                    ):(
                        <div className="no-question-placeholder">
                            <h3><DocumentIcon size={20} /> No Question Selected</h3>
                            {role==='recruiter'? (
                                <p>Click &quot;Change Question&quot; to select or create a question</p>
                            ):(
                                <p>Waiting for interviewer to select a question...</p>
                            )}
                        </div>
                    )}

                    <div className="editor-section">
                        <div className="editor-header">
                            <select
                                className="select language-select"
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>

                            <div className="editor-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleRunCode}
                                    disabled={loading}
                                >
                                    <PlayIcon size={16} /> Run Code
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleSubmitCode}
                                    disabled={loading}
                                >
                                    <CheckIcon size={16} /> Submit
                                </button>
                            </div>
                        </div>

                        <CodeEditor
                            code={code}
                            language={language}
                            onChange={handleCodeChange}
                        />

                        <div className="output-panel">
                            <div className="output-header">Output:</div>
                            <pre className="output-content">{output||'Run your code to see output...'}</pre>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Chat */}
                {showChat&&(
                    <div className="right-panel">
                        <ChatPanel
                            interviewId={interviewId}
                            userName={userName}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default InterviewRoom;
