import {useState, useEffect, useCallback} from 'react';
import CodeEditor from '../components/CodeEditor';
import api from '../services/api';
import
  {
    Play, Send, ChevronDown, ChevronRight, CheckCircle, XCircle,
    Terminal, FlaskConical, Clock, Code2, FileText, RotateCcw, Maximize2, Minimize2,
    Sparkles, Lightbulb, Loader2, Filter, Eye, EyeOff, AlertCircle, Trophy
  } from 'lucide-react';
import './CodingPractice.css';

const AI_TOPICS=['Arrays','Strings','Linked Lists','Trees','Graphs','Dynamic Programming',
  'Sorting','Searching','Hash Tables','Stacks & Queues','Recursion','Math','Greedy','Backtracking'];

function CodingPractice()
{
  const [questions, setQuestions]=useState([]);
  const [selectedQuestion, setSelectedQuestion]=useState(null);
  const [code, setCode]=useState('');
  const [language, setLanguage]=useState('javascript');
  const [output, setOutput]=useState('');
  const [loading, setLoading]=useState(false);
  const [submitting, setSubmitting]=useState(false);
  const [testResults, setTestResults]=useState(null);
  const [activeTab, setActiveTab]=useState('output');
  const [sidebarCollapsed, setSidebarCollapsed]=useState(false);
  const [outputExpanded, setOutputExpanded]=useState(false);
  const [runTime, setRunTime]=useState(null);

  // AI generation state
  const [showAIPanel, setShowAIPanel]=useState(false);
  const [aiDifficulty, setAiDifficulty]=useState('Medium');
  const [aiTopics, setAiTopics]=useState([]);
  const [generating, setGenerating]=useState(false);

  // Hint
  const [hint, setHint]=useState('');
  const [hintLoading, setHintLoading]=useState(false);

  // Filter
  const [difficultyFilter, setDifficultyFilter]=useState('');

  // Submit status
  const [submitStatus, setSubmitStatus]=useState(null); // 'accepted' | 'wrong' | null

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions=async () =>
  {
    try
    {
      const response=await api.get('/coding-practice/questions');
      const qs=response.data.questions||[];
      setQuestions(qs);
      if (qs.length>0) selectQuestion(qs[0]);
    } catch (error)
    {
      console.error('Error fetching questions:', error);
    }
  };

  const selectQuestion=(question) =>
  {
    setSelectedQuestion(question);
    setCode(getStarterCode(question, language));
    setOutput('');
    setTestResults(null);
    setRunTime(null);
    setHint('');
    setSubmitStatus(null);
  };

  const getStarterCode=(question, lang) =>
  {
    if (question.starterCode&&question.starterCode[lang]) return question.starterCode[lang];
    const starters={
      javascript: `// ${question.title}\nfunction solution() {\n  // Write your code here\n}\n`,
      python: `# ${question.title}\ndef solution():\n    # Write your code here\n    pass\n`,
      java: `// ${question.title}\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}`,
      cpp: `// ${question.title}\n#include <vector>\nusing namespace std;\n\n// Write your code here\n`
    };
    return starters[lang]||starters.javascript;
  };

  const handleLanguageChange=(newLang) =>
  {
    setLanguage(newLang);
    if (selectedQuestion) setCode(getStarterCode(selectedQuestion, newLang));
  };

  const handleReset=() =>
  {
    if (selectedQuestion)
    {
      setCode(getStarterCode(selectedQuestion, language));
      setOutput('');
      setTestResults(null);
      setRunTime(null);
      setHint('');
      setSubmitStatus(null);
    }
  };

  // ── Run (visible test cases only) ──
  const handleRunCode=async () =>
  {
    setLoading(true);
    setOutput('');
    setTestResults(null);
    setActiveTab('output');
    setSubmitStatus(null);
    const start=Date.now();
    try
    {
      const payload={code, language, questionId: selectedQuestion.id};
      if (selectedQuestion.isAIGenerated)
      {
        payload.testCases=selectedQuestion.testCases||[];
        payload.functionName=selectedQuestion.functionName||{};
      }
      const response=await api.post('/coding-practice/run', payload);
      setRunTime(Date.now()-start);
      if (response.data.results)
      {
        setTestResults(response.data.results);
        setActiveTab('tests');
        setOutput(response.data.output||'');
      } else
      {
        setOutput(response.data.output||'Code executed successfully (no output)');
      }
    } catch (error)
    {
      setRunTime(Date.now()-start);
      setOutput('Error: '+(error.response?.data?.error||'Failed to execute code'));
    } finally { setLoading(false); }
  };

  // ── Submit (all test cases including hidden) ──
  const handleSubmit=async () =>
  {
    setSubmitting(true);
    setTestResults(null);
    setActiveTab('tests');
    setSubmitStatus(null);
    const start=Date.now();
    try
    {
      const payload={code, language, questionId: selectedQuestion.id};
      if (selectedQuestion.isAIGenerated)
      {
        // For AI questions include ALL test cases (visible+hidden from generation)
        payload.testCases=selectedQuestion._allTestCases||selectedQuestion.testCases||[];
        payload.functionName=selectedQuestion.functionName||{};
      }
      const response=await api.post('/coding-practice/submit', payload);
      setRunTime(Date.now()-start);
      setTestResults(response.data.results);
      setSubmitStatus(response.data.solved? 'accepted':'wrong');
      setOutput(response.data.message||'');
    } catch (error)
    {
      setRunTime(Date.now()-start);
      setOutput('Error: '+(error.response?.data?.error||'Failed to submit code'));
      setSubmitStatus('wrong');
    } finally { setSubmitting(false); }
  };

  // ── AI Question Generation ──
  const handleGenerate=async () =>
  {
    setGenerating(true);
    try
    {
      const response=await api.post('/coding-practice/generate', {
        difficulty: aiDifficulty,
        topics: aiTopics.length>0? aiTopics:undefined,
        language
      });
      if (response.data.success&&response.data.question)
      {
        const q=response.data.question;
        // Store all test cases privately, expose only visible ones for display
        const allTC=q.testCases||[];
        q._allTestCases=allTC;
        q.testCases=allTC.filter(tc => !tc.hidden);
        q.totalTestCases=allTC.length;
        q.hiddenTestCases=allTC.filter(tc => tc.hidden).length;

        setQuestions(prev => [q, ...prev]);
        selectQuestion(q);
        setShowAIPanel(false);
      }
    } catch (error)
    {
      console.error('AI generation error:', error);
      setOutput('Failed to generate question: '+(error.response?.data?.error||error.message));
    } finally { setGenerating(false); }
  };

  // ── Get Hint ──
  const handleHint=async () =>
  {
    if (!selectedQuestion) return;
    setHintLoading(true);
    try
    {
      const response=await api.post('/coding-practice/hint', {
        code, language,
        title: selectedQuestion.title,
        description: selectedQuestion.description
      });
      setHint(response.data.hint||'No hint available.');
    } catch (error)
    {
      setHint('Could not load hint. Try breaking the problem into smaller parts.');
    } finally { setHintLoading(false); }
  };

  const toggleAiTopic=(topic) =>
  {
    setAiTopics(prev => prev.includes(topic)? prev.filter(t => t!==topic):[...prev, topic]);
  };

  const difficultyColor=(d) =>
  {
    const dl=d?.toLowerCase();
    if (dl==='easy') return '#22c55e';
    if (dl==='medium') return '#f59e0b';
    return '#ef4444';
  };

  const filteredQuestions=difficultyFilter
    ? questions.filter(q => q.difficulty?.toLowerCase()===difficultyFilter.toLowerCase())
    : questions;

  const visibleResults=testResults?.visibleTests||[];
  const hiddenResults=testResults?.hiddenTests||[];
  const passedCount=testResults? testResults.passedTests:0;
  const totalTests=testResults? testResults.totalTests:0;

  return (
    <div className="cp-ide">
      {/* ── Sidebar ── */}
      <div className={`cp-ide-sidebar ${sidebarCollapsed? 'collapsed':''}`}>
        <div className="cp-ide-sidebar-header">
          {!sidebarCollapsed&&<h3><FileText size={16} /> Problems</h3>}
          <button className="cp-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed? <ChevronRight size={16} />:<ChevronDown size={16} />}
          </button>
        </div>

        {!sidebarCollapsed&&(
          <>
            {/* Controls */}
            <div className="cp-sidebar-controls">
              <button className="cp-ai-gen-btn" onClick={() => setShowAIPanel(!showAIPanel)}>
                <Sparkles size={14} /> AI Generate
              </button>
              <select className="cp-filter-select" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
                <option value="">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* AI Generation Panel */}
            {showAIPanel&&(
              <div className="cp-ai-panel">
                <h4><Sparkles size={14} /> Generate AI Question</h4>
                <div className="cp-ai-diff-btns">
                  {['Easy','Medium','Hard'].map(d => (
                    <button key={d} className={`cp-ai-diff-btn ${aiDifficulty===d? 'active':''}`}
                      style={{borderColor: difficultyColor(d), color: aiDifficulty===d? '#fff':difficultyColor(d),
                        background: aiDifficulty===d? difficultyColor(d):'transparent'}}
                      onClick={() => setAiDifficulty(d)}>{d}</button>
                  ))}
                </div>
                <div className="cp-ai-topics">
                  {AI_TOPICS.map(t => (
                    <button key={t} className={`cp-ai-topic-btn ${aiTopics.includes(t)? 'active':''}`}
                      onClick={() => toggleAiTopic(t)}>{t}</button>
                  ))}
                </div>
                <button className="cp-ai-generate-btn" onClick={handleGenerate} disabled={generating}>
                  {generating? <><Loader2 size={14} className="cp-spin" /> Generating...</>:<><Sparkles size={14} /> Generate Question</>}
                </button>
              </div>
            )}

            {/* Questions List */}
            <div className="cp-ide-questions">
              {filteredQuestions.length===0? (
                <div className="cp-no-questions">
                  <p>No questions found.</p>
                  <button onClick={() => {setShowAIPanel(true); setDifficultyFilter('');}}>
                    <Sparkles size={14} /> Generate one with AI
                  </button>
                </div>
              ):(
                filteredQuestions.map(q => (
                  <div key={q.id} className={`cp-ide-question ${selectedQuestion?.id===q.id? 'active':''}`}
                    onClick={() => selectQuestion(q)}>
                    <span className="cp-q-title">
                      {q.isAIGenerated&&<Sparkles size={12} className="cp-ai-icon" />}
                      {q.title}
                    </span>
                    <span className="cp-q-diff" style={{color: difficultyColor(q.difficulty), borderColor: difficultyColor(q.difficulty)}}>
                      {q.difficulty}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Main Area ── */}
      <div className="cp-ide-main">
        {!selectedQuestion? (
          <div className="cp-ide-empty">
            <Code2 size={48} />
            <h2>Select a Problem</h2>
            <p>Choose from the sidebar or generate an AI question</p>
            <button className="cp-ai-gen-btn-big" onClick={() => {setSidebarCollapsed(false); setShowAIPanel(true);}}>
              <Sparkles size={16} /> Generate AI Question
            </button>
          </div>
        ):(
          <>
            {/* Problem Description */}
            <div className="cp-ide-problem">
              <div className="cp-ide-problem-header">
                <h1>
                  {selectedQuestion.isAIGenerated&&<Sparkles size={18} className="cp-ai-icon" />}
                  {selectedQuestion.title}
                </h1>
                <span className="cp-ide-diff-badge" style={{color: difficultyColor(selectedQuestion.difficulty), borderColor: difficultyColor(selectedQuestion.difficulty)}}>
                  {selectedQuestion.difficulty}
                </span>
              </div>

              {/* Tags */}
              {selectedQuestion.topics&&selectedQuestion.topics.length>0&&(
                <div className="cp-ide-tags">
                  {selectedQuestion.topics.map((t, i) => <span key={i} className="cp-ide-tag">{t}</span>)}
                </div>
              )}

              <p className="cp-ide-desc">{selectedQuestion.description}</p>

              {/* Examples */}
              {selectedQuestion.examples&&selectedQuestion.examples.length>0&&(
                <div className="cp-ide-example">
                  <h4>Examples:</h4>
                  {selectedQuestion.examples.map((ex, i) => (
                    <div key={i} className="cp-ide-example-box">
                      <div className="cp-ide-example-line"><span className="cp-label">Input:</span> <code>{ex.input}</code></div>
                      <div className="cp-ide-example-line"><span className="cp-label">Output:</span> <code>{typeof ex.output==='object'? JSON.stringify(ex.output):String(ex.output)}</code></div>
                      {ex.explanation&&<div className="cp-ide-example-line"><span className="cp-label">Explanation:</span> {ex.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {selectedQuestion.constraints&&selectedQuestion.constraints.length>0&&(
                <div className="cp-ide-constraints">
                  <h4>Constraints:</h4>
                  <ul>{selectedQuestion.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}

              {/* Test case info */}
              <div className="cp-ide-tc-info">
                <span><Eye size={12} /> {(selectedQuestion.testCases||[]).length} visible</span>
                {selectedQuestion.hiddenTestCases>0&&<span><EyeOff size={12} /> {selectedQuestion.hiddenTestCases} hidden</span>}
              </div>

              {/* Hint */}
              <button className="cp-hint-btn" onClick={handleHint} disabled={hintLoading}>
                {hintLoading? <Loader2 size={14} className="cp-spin" />:<Lightbulb size={14} />}
                {hintLoading? 'Loading...':'Get Hint'}
              </button>
              {hint&&<div className="cp-hint-box">{hint}</div>}
            </div>

            {/* Code + Output */}
            <div className={`cp-ide-workspace ${outputExpanded? 'output-expanded':''}`}>
              <div className="cp-ide-toolbar">
                <div className="cp-ide-toolbar-left">
                  <div className="cp-ide-lang-select">
                    <Code2 size={14} />
                    <select value={language} onChange={e => handleLanguageChange(e.target.value)}>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  <button className="cp-ide-tool-btn" onClick={handleReset} title="Reset Code">
                    <RotateCcw size={14} />
                  </button>
                </div>
                <div className="cp-ide-toolbar-right">
                  <button className="cp-ide-run-btn" onClick={handleRunCode} disabled={loading||submitting}>
                    {loading? <Loader2 size={14} className="cp-spin" />:<Play size={14} />} {loading? 'Running...':'Run'}
                  </button>
                  <button className="cp-ide-submit-btn" onClick={handleSubmit} disabled={loading||submitting}>
                    {submitting? <Loader2 size={14} className="cp-spin" />:<Send size={14} />} {submitting? 'Submitting...':'Submit'}
                  </button>
                </div>
              </div>

              <div className="cp-ide-editor">
                <CodeEditor code={code} onChange={setCode} language={language} />
              </div>

              {/* Output Panel */}
              <div className={`cp-ide-output ${outputExpanded? 'expanded':''}`}>
                <div className="cp-ide-output-header">
                  <div className="cp-ide-output-tabs">
                    <button className={`cp-ide-tab ${activeTab==='output'? 'active':''}`} onClick={() => setActiveTab('output')}>
                      <Terminal size={13} /> Output
                    </button>
                    <button className={`cp-ide-tab ${activeTab==='tests'? 'active':''}`} onClick={() => setActiveTab('tests')}>
                      <FlaskConical size={13} /> Test Results
                      {testResults&&(
                        <span className={`cp-ide-tab-badge ${testResults.allPassed? 'pass':'fail'}`}>
                          {passedCount}/{totalTests}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="cp-ide-output-controls">
                    {runTime!=null&&<span className="cp-ide-runtime"><Clock size={12} /> {runTime}ms</span>}
                    <button className="cp-ide-expand-btn" onClick={() => setOutputExpanded(!outputExpanded)}
                      title={outputExpanded? 'Minimize':'Maximize'}>
                      {outputExpanded? <Minimize2 size={14} />:<Maximize2 size={14} />}
                    </button>
                  </div>
                </div>

                <div className="cp-ide-output-body">
                  {/* Submit status banner */}
                  {submitStatus&&(
                    <div className={`cp-submit-status ${submitStatus}`}>
                      {submitStatus==='accepted'? <><Trophy size={16} /> Accepted – All test cases passed!</>
                        :<><AlertCircle size={16} /> Wrong Answer – Some test cases failed</>}
                    </div>
                  )}

                  {activeTab==='output'&&(
                    <div className="cp-ide-output-content">
                      {loading? (
                        <div className="cp-ide-output-loading"><div className="cp-ide-spinner" /><span>Executing code...</span></div>
                      ):output? (<pre>{output}</pre>):(
                        <p className="cp-ide-output-empty">Click "Run" to see output here</p>
                      )}
                    </div>
                  )}

                  {activeTab==='tests'&&(
                    <div className="cp-ide-test-results">
                      {!testResults? (
                        <p className="cp-ide-output-empty">Click "Run" or "Submit" to run test cases</p>
                      ):(
                        <>
                          <div className="cp-ide-test-summary">
                            <span className={testResults.allPassed? 'pass':'fail'}>
                              {testResults.allPassed? <CheckCircle size={16} />:<XCircle size={16} />}
                              {passedCount}/{totalTests} test cases passed
                            </span>
                          </div>

                          {/* Visible Test Cases */}
                          <div className="cp-ide-test-list">
                            {visibleResults.map((result, index) => (
                              <div key={index} className={`cp-ide-test-case ${result.passed? 'passed':'failed'}`}>
                                <div className="cp-ide-test-header">
                                  {result.passed? <CheckCircle size={14} />:<XCircle size={14} />}
                                  <span>Test Case {result.caseNumber||index+1}</span>
                                  <span className="cp-ide-test-status">{result.passed? 'Passed':'Failed'}</span>
                                  {result.executionTime!=null&&<span className="cp-ide-test-time"><Clock size={11} /> {result.executionTime}ms</span>}
                                </div>
                                {result.input&&(
                                  <div className="cp-ide-test-detail">
                                    <span className="cp-label">Input:</span>
                                    <code>{typeof result.input==='object'? JSON.stringify(result.input):String(result.input)}</code>
                                  </div>
                                )}
                                {result.expectedOutput!==undefined&&(
                                  <div className="cp-ide-test-detail">
                                    <span className="cp-label">Expected:</span>
                                    <code>{typeof result.expectedOutput==='object'? JSON.stringify(result.expectedOutput):String(result.expectedOutput)}</code>
                                  </div>
                                )}
                                {result.actualOutput!==undefined&&!result.passed&&(
                                  <div className="cp-ide-test-detail">
                                    <span className="cp-label">Got:</span>
                                    <code className="error">{typeof result.actualOutput==='object'? JSON.stringify(result.actualOutput):String(result.actualOutput)}</code>
                                  </div>
                                )}
                                {result.error&&(
                                  <div className="cp-ide-test-detail">
                                    <span className="cp-label">Error:</span>
                                    <code className="error">{result.error}</code>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Hidden Test Cases Summary */}
                          {hiddenResults.length>0&&(
                            <div className="cp-hidden-tests-section">
                              <div className="cp-hidden-test-header">
                                <EyeOff size={14} /> Hidden Test Cases
                              </div>
                              <div className="cp-hidden-summary">
                                {hiddenResults.map((h, i) => (
                                  <div key={i} className={`cp-hidden-dot ${h.passed? 'pass':'fail'}`} title={`Hidden #${h.caseNumber}: ${h.passed? 'Passed':'Failed'}`}>
                                    {h.passed? <CheckCircle size={12} />:<XCircle size={12} />}
                                  </div>
                                ))}
                                <span className="cp-hidden-count">
                                  {hiddenResults.filter(h => h.passed).length}/{hiddenResults.length} passed
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CodingPractice;
