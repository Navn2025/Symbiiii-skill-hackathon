import {useState, useEffect, useRef, useCallback} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {io} from 'socket.io-client';
import {Code2, Clock, Trophy, Users, Play, Send, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Lightbulb, RotateCcw} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import './ContestPlay.css';

const API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000';

const DIFFICULTY_COLORS={easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444'};

function fmtTime(totalSec)
{
    if (totalSec<=0) return '0:00';
    const h=Math.floor(totalSec/3600);
    const m=Math.floor((totalSec%3600)/60);
    const s=totalSec%60;
    if (h>0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ContestPlay()
{
    const [searchParams]=useSearchParams();
    const navigate=useNavigate();
    const code=searchParams.get('code');
    const playerName=searchParams.get('name');
    const socketRef=useRef(null);

    // State
    const [phase, setPhase]=useState('connecting');
    const [contestTitle, setContestTitle]=useState('');
    const [hostName, setHostName]=useState('');
    const [participants, setParticipants]=useState([]);

    // Challenges
    const [challenges, setChallenges]=useState([]);
    const [currentIdx, setCurrentIdx]=useState(0);
    const [submittedMap, setSubmittedMap]=useState({});

    // Code editor
    const [codeValue, setCodeValue]=useState('');
    const [language, setLanguage]=useState('javascript');

    // Submission state
    const [running, setRunning]=useState(false);
    const [submitting, setSubmitting]=useState(false);
    const [runResults, setRunResults]=useState(null);
    const [submitResults, setSubmitResults]=useState(null);
    const [showHints, setShowHints]=useState(false);

    // Timer
    const [remainingSec, setRemainingSec]=useState(0);
    const countdownRef=useRef(null);
    const challengeOpenTime=useRef(null);

    // Scores
    const [myScore, setMyScore]=useState(0);
    const [mySolvedCount, setMySolvedCount]=useState(0);
    const [myRank, setMyRank]=useState(null);
    const [leaderboard, setLeaderboard]=useState([]);
    const [endData, setEndData]=useState(null);
    const [error, setError]=useState('');

    const startCountdown=useCallback((endsAtISO) =>
    {
        if (countdownRef.current) clearInterval(countdownRef.current);
        const end=new Date(endsAtISO).getTime();
        const tick=() =>
        {
            const left=Math.max(0, Math.round((end-Date.now())/1000));
            setRemainingSec(left);
            if (left<=0&&countdownRef.current) clearInterval(countdownRef.current);
        };
        tick();
        countdownRef.current=setInterval(tick, 1000);
    }, []);

    // Socket connection
    useEffect(() =>
    {
        if (!code||!playerName)
        {
            navigate('/contest/dashboard?view=join');
            return;
        }

        const socket=io(API_URL, {withCredentials: true});
        socketRef.current=socket;

        socket.on('connect', () =>
        {
            socket.emit('contest:participant-join', {code, name: playerName});
        });

        socket.on('contest:joined', ({status, challenges: ch, totalChallenges, title, hostName: hn, endsAt, duration, submittedIndices, participants: p}) =>
        {
            setContestTitle(title||'Contest');
            setHostName(hn||'Host');
            setParticipants(p||[]);

            if (status==='active'&&ch)
            {
                setChallenges(ch);
                setPhase('active');
                if (endsAt) startCountdown(endsAt);
                challengeOpenTime.current=Date.now();
                // Set initial code
                if (ch.length>0)
                {
                    setCodeValue(ch[0].starterCode?.[language]||getDefaultStarter(ch[0], language));
                }
                // Mark submitted
                if (submittedIndices)
                {
                    const map={};
                    submittedIndices.forEach(i => {map[i]={submitted: true};});
                    setSubmittedMap(map);
                }
            } else if (status==='completed')
            {
                setPhase('ended');
            } else
            {
                setPhase('waiting');
            }
        });

        socket.on('contest:participant-update', ({participants: p}) =>
        {
            setParticipants(p||[]);
        });

        socket.on('contest:started', ({challenges: ch, totalChallenges, endsAt, duration}) =>
        {
            setChallenges(ch||[]);
            setPhase('active');
            if (endsAt) startCountdown(endsAt);
            challengeOpenTime.current=Date.now();
            if (ch&&ch.length>0)
            {
                setCodeValue(ch[0].starterCode?.[language]||getDefaultStarter(ch[0], language));
            }
        });

        socket.on('contest:run-result', ({challengeIndex, results, passed, total, output}) =>
        {
            setRunning(false);
            setRunResults({challengeIndex, results, passed, total, output});
        });

        socket.on('contest:submission-result', ({challengeIndex, passed, total, pointsEarned, totalScore, solvedCount, rank, allPassed, results}) =>
        {
            setSubmitting(false);
            setSubmitResults({challengeIndex, passed, total, pointsEarned, allPassed, results});
            setMyScore(totalScore);
            setMySolvedCount(solvedCount);
            setMyRank(rank);
            setSubmittedMap(prev => ({...prev, [challengeIndex]: {submitted: true, allPassed}}));
        });

        socket.on('contest:leaderboard-live', ({leaderboard: lb}) =>
        {
            setLeaderboard(lb||[]);
        });

        socket.on('contest:progress-update', ({leaderboard: lb, remainingMs}) =>
        {
            setLeaderboard(lb||[]);
            if (remainingMs!==undefined) setRemainingSec(Math.max(0, Math.round(remainingMs/1000)));
        });

        socket.on('contest:ended', ({leaderboard: lb, stats}) =>
        {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setLeaderboard(lb||[]);
            setEndData(stats);
            setPhase('ended');
        });

        socket.on('contest:error', ({message}) => setError(message));

        return () =>
        {
            if (countdownRef.current) clearInterval(countdownRef.current);
            socket.disconnect();
        };
    }, [code, playerName, navigate, startCountdown, language]);

    const getDefaultStarter=(challenge, lang) =>
    {
        const fn=challenge?.functionName?.[lang]||'solution';
        const starters={
            javascript: `function ${fn}(input) {\n  // Write your code here\n  return result;\n}\n`,
            python: `def ${fn}(input):\n    # Write your code here\n    return result\n`,
            java: `public class Solution {\n    public static String ${fn}(String input) {\n        // Write your code here\n        return result;\n    }\n}`,
            cpp: `#include <string>\nusing namespace std;\n\nstring ${fn}(string input) {\n    // Write your code here\n    return result;\n}`,
        };
        return starters[lang]||starters.javascript;
    };

    const selectChallenge=(idx) =>
    {
        setCurrentIdx(idx);
        setRunResults(null);
        setSubmitResults(null);
        setShowHints(false);
        const ch=challenges[idx];
        if (ch)
        {
            setCodeValue(ch.starterCode?.[language]||getDefaultStarter(ch, language));
        }
        challengeOpenTime.current=Date.now();
    };

    const handleLanguageChange=(newLang) =>
    {
        setLanguage(newLang);
        const ch=challenges[currentIdx];
        if (ch)
        {
            setCodeValue(ch.starterCode?.[newLang]||getDefaultStarter(ch, newLang));
        }
    };

    const handleRun=() =>
    {
        setRunning(true);
        setRunResults(null);
        setSubmitResults(null);
        socketRef.current?.emit('contest:run-code', {
            challengeIndex: currentIdx,
            code: codeValue,
            language,
        });
    };

    const handleSubmit=() =>
    {
        setSubmitting(true);
        setRunResults(null);
        setSubmitResults(null);
        const timeMs=challengeOpenTime.current? Date.now()-challengeOpenTime.current:0;
        socketRef.current?.emit('contest:submit-code', {
            challengeIndex: currentIdx,
            code: codeValue,
            language,
            timeMs,
        });
    };

    const handleReset=() =>
    {
        const ch=challenges[currentIdx];
        if (ch)
        {
            setCodeValue(ch.starterCode?.[language]||getDefaultStarter(ch, language));
        }
        setRunResults(null);
        setSubmitResults(null);
    };

    const currentChallenge=challenges[currentIdx];
    const durationSec=90*60;
    const timerPct=durationSec>0? (remainingSec/durationSec)*100:0;
    const timerColor=timerPct>50? '#22c55e':timerPct>20? '#f59e0b':'#ef4444';

    if (phase==='connecting')
    {
        return (
            <div className="cp-root">
                <div className="cp-spinner">
                    <div className="cp-spin" />
                    <p>Connecting to contest...</p>
                </div>
            </div>
        );
    }

    if (phase==='waiting')
    {
        return (
            <div className="cp-root">
                <div className="cp-waiting">
                    <Code2 size={48} />
                    <h2>Waiting for contest to start...</h2>
                    <p>{contestTitle}</p>
                    <p className="cp-sub">Hosted by {hostName}</p>
                    <div className="cp-waiting-participants">
                        <Users size={16} /> {participants.length} participants
                    </div>
                </div>
            </div>
        );
    }

    if (phase==='ended')
    {
        return (
            <div className="cp-root cp-ended-root">
                <div className="cp-ended">
                    <Trophy size={48} className="cp-trophy" />
                    <h2>Contest Complete!</h2>
                    <p className="cp-sub">{contestTitle}</p>
                    <div className="cp-your-result">
                        <div className="cp-result-stat">
                            <span className="cp-result-val">{myScore}</span>
                            <span className="cp-result-lbl">Points</span>
                        </div>
                        <div className="cp-result-stat">
                            <span className="cp-result-val">#{myRank||'-'}</span>
                            <span className="cp-result-lbl">Rank</span>
                        </div>
                        <div className="cp-result-stat">
                            <span className="cp-result-val">{mySolvedCount}/{challenges.length}</span>
                            <span className="cp-result-lbl">Solved</span>
                        </div>
                    </div>
                    <div className="cp-final-lb">
                        <h3>Final Leaderboard</h3>
                        {leaderboard.slice(0, 10).map((p, i) => (
                            <div className="cp-lb-row" key={i}>
                                <span className="cp-lb-rank">#{p.rank}</span>
                                <span className="cp-lb-name">{p.name}</span>
                                <span className="cp-lb-score">{p.score} pts</span>
                                <span className="cp-lb-solved">{p.solvedCount} solved</span>
                            </div>
                        ))}
                    </div>
                    <button className="cp-btn-primary" onClick={() => navigate('/contest/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cp-root">
            {/* Header */}
            <header className="cp-header">
                <div className="cp-header-left">
                    <Code2 size={20} />
                    <span className="cp-title">{contestTitle}</span>
                </div>
                <div className="cp-header-center">
                    <div className="cp-timer" style={{color: timerColor}}>
                        <Clock size={16} /> {fmtTime(remainingSec)}
                    </div>
                </div>
                <div className="cp-header-right">
                    <span className="cp-score"><Trophy size={14} /> {myScore} pts</span>
                    <span className="cp-rank">#{myRank||'-'}</span>
                </div>
            </header>

            {error&&<div className="cp-error">{error}</div>}

            <div className="cp-main">
                {/* Problem sidebar */}
                <aside className="cp-sidebar">
                    <h3>Problems ({challenges.length})</h3>
                    <div className="cp-problem-list">
                        {challenges.map((ch, i) =>
                        {
                            const status=submittedMap[i];
                            return (
                                <button
                                    key={i}
                                    className={`cp-problem-btn ${i===currentIdx? 'active':''} ${status?.allPassed? 'solved':status?.submitted? 'attempted':''}`}
                                    onClick={() => selectChallenge(i)}
                                >
                                    <span className="cp-prob-num">{i+1}</span>
                                    <span className="cp-prob-title">{ch.title}</span>
                                    <span className="cp-prob-pts" style={{color: DIFFICULTY_COLORS[ch.difficulty]}}>{ch.points}pts</span>
                                    {status?.allPassed&&<CheckCircle size={14} className="cp-prob-check" />}
                                </button>
                            );
                        })}
                    </div>
                    <div className="cp-sidebar-lb">
                        <h4><Trophy size={14} /> Leaderboard</h4>
                        {leaderboard.slice(0, 5).map((p, i) => (
                            <div className="cp-mini-lb-row" key={i}>
                                <span>#{p.rank}</span>
                                <span>{p.name}</span>
                                <span>{p.score}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Problem + Editor */}
                <div className="cp-content">
                    {currentChallenge? (
                        <>
                            {/* Problem description */}
                            <div className="cp-problem-panel">
                                <div className="cp-problem-header">
                                    <h2>{currentChallenge.title}</h2>
                                    <span className={`cp-difficulty ${currentChallenge.difficulty}`} style={{color: DIFFICULTY_COLORS[currentChallenge.difficulty]}}>
                                        {currentChallenge.difficulty} | {currentChallenge.points} pts
                                    </span>
                                </div>
                                <div className="cp-problem-desc">{currentChallenge.description}</div>

                                {currentChallenge.examples?.length>0&&(
                                    <div className="cp-examples">
                                        <h4>Examples</h4>
                                        {currentChallenge.examples.map((ex, i) => (
                                            <div key={i} className="cp-example">
                                                <div className="cp-ex-row"><strong>Input:</strong> <code>{ex.input}</code></div>
                                                <div className="cp-ex-row"><strong>Output:</strong> <code>{ex.output}</code></div>
                                                {ex.explanation&&<div className="cp-ex-row"><strong>Explanation:</strong> {ex.explanation}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentChallenge.constraints?.length>0&&(
                                    <div className="cp-constraints">
                                        <h4>Constraints</h4>
                                        <ul>
                                            {currentChallenge.constraints.map((c, i) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {currentChallenge.hints?.length>0&&(
                                    <div className="cp-hints">
                                        <button className="cp-hint-btn" onClick={() => setShowHints(!showHints)}>
                                            <Lightbulb size={14} /> {showHints? 'Hide Hints':'Show Hints'}
                                        </button>
                                        {showHints&&(
                                            <ul className="cp-hint-list">
                                                {currentChallenge.hints.map((h, i) => <li key={i}>{h}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Visible test cases */}
                                {currentChallenge.testCases?.length>0&&(
                                    <div className="cp-test-cases">
                                        <h4><Eye size={14} /> Visible Test Cases</h4>
                                        {currentChallenge.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                                            <div key={i} className="cp-tc">
                                                <div><strong>Input:</strong> <code>{tc.input}</code></div>
                                                <div><strong>Expected:</strong> <code>{tc.output}</code></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Code editor */}
                            <div className="cp-editor-panel">
                                <div className="cp-editor-toolbar">
                                    <select value={language} onChange={e => handleLanguageChange(e.target.value)}>
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="cpp">C++</option>
                                    </select>
                                    <button className="cp-btn-reset" onClick={handleReset}>
                                        <RotateCcw size={14} /> Reset
                                    </button>
                                    <button className="cp-btn-run" onClick={handleRun} disabled={running}>
                                        <Play size={14} /> {running? 'Running...':'Run'}
                                    </button>
                                    <button className="cp-btn-submit" onClick={handleSubmit} disabled={submitting}>
                                        <Send size={14} /> {submitting? 'Submitting...':'Submit'}
                                    </button>
                                </div>

                                <div className="cp-editor-container">
                                    <CodeEditor
                                        value={codeValue}
                                        onChange={setCodeValue}
                                        language={language}
                                        height="350px"
                                    />
                                </div>

                                {/* Results */}
                                {(runResults||submitResults)&&(
                                    <div className="cp-results">
                                        {runResults&&(
                                            <div className="cp-run-results">
                                                <h4>Run Results: {runResults.passed}/{runResults.total} passed</h4>
                                                {runResults.results?.map((r, i) => (
                                                    <div key={i} className={`cp-result-row ${r.passed? 'passed':'failed'}`}>
                                                        {r.passed? <CheckCircle size={14} />:<XCircle size={14} />}
                                                        <span>Test {i+1}: {r.passed? 'Passed':'Failed'}</span>
                                                        {!r.passed&&<span className="cp-result-detail">Expected: {r.expected}, Got: {r.actual}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {submitResults&&(
                                            <div className={`cp-submit-results ${submitResults.allPassed? 'success':''}`}>
                                                <h4>
                                                    {submitResults.allPassed? <CheckCircle size={18} />:<AlertTriangle size={18} />}
                                                    {submitResults.allPassed? ' All Tests Passed!':` ${submitResults.passed}/${submitResults.total} Tests Passed`}
                                                </h4>
                                                <p>Points earned: +{submitResults.pointsEarned}</p>
                                                {submitResults.results?.map((r, i) => (
                                                    <div key={i} className={`cp-result-row ${r.passed? 'passed':'failed'}`}>
                                                        {r.passed? <CheckCircle size={14} />:<XCircle size={14} />}
                                                        <span>Test {i+1} {r.hidden? '(hidden)':''}: {r.passed? 'Passed':'Failed'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ):(
                        <div className="cp-no-problem">Select a problem to start</div>
                    )}
                </div>
            </div>
        </div>
    );
}
