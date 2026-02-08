import { useState, useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import axios from 'axios';
import './CodingPractice.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CodingPractice() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/coding-practice/questions`);
      setQuestions(response.data.questions || []);
      if (response.data.questions && response.data.questions.length > 0) {
        selectQuestion(response.data.questions[0]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Mock data for development
      const mockQuestions = [
        {
          id: 1,
          title: 'Two Sum',
          difficulty: 'Easy',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
          exampleInput: '[2, 7, 11, 15], target = 9',
          exampleOutput: '[0, 1]',
          testCases: []
        }
      ];
      setQuestions(mockQuestions);
      selectQuestion(mockQuestions[0]);
    }
  };

  const selectQuestion = (question) => {
    setSelectedQuestion(question);
    setCode(getStarterCode(question, language));
    setOutput('');
    setTestResults(null);
  };

  const getStarterCode = (question, lang) => {
    const starters = {
      javascript: `// ${question.title}\nfunction solution() {\n  // Write your code here\n  \n}\n\nsolution();`,
      python: `# ${question.title}\ndef solution():\n    # Write your code here\n    pass\n\nsolution()`,
      java: `// ${question.title}\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}`
    };
    return starters[lang] || starters.javascript;
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (selectedQuestion) {
      setCode(getStarterCode(selectedQuestion, newLanguage));
    }
  };

  const handleRunCode = async () => {
    setLoading(true);
    setOutput('Running code...');
    
    try {
      const response = await axios.post(`${API_URL}/api/coding-practice/run`, {
        code,
        language,
        questionId: selectedQuestion.id
      });
      
      setOutput(response.data.output || 'Code executed successfully');
      setTestResults(response.data.testResults);
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('Error: ' + (error.response?.data?.error || 'Failed to execute code'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/coding-practice/submit`, {
        code,
        language,
        questionId: selectedQuestion.id
      });
      
      setTestResults(response.data.testResults);
      if (response.data.allPassed) {
        setOutput('✅ All test cases passed! Great job!');
      } else {
        setOutput('❌ Some test cases failed. Keep trying!');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      setOutput('Error: ' + (error.response?.data?.error || 'Failed to submit code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="coding-practice">
      <div className="practice-sidebar">
        <h2>Problems</h2>
        <div className="questions-list">
          {questions.map(q => (
            <div
              key={q.id}
              className={`question-item ${selectedQuestion?.id === q.id ? 'active' : ''}`}
              onClick={() => selectQuestion(q)}
            >
              <h3>{q.title}</h3>
              <span className={`difficulty ${q.difficulty.toLowerCase()}`}>
                {q.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="practice-main">
        {selectedQuestion && (
          <>
            <div className="question-details">
              <h1>{selectedQuestion.title}</h1>
              <span className={`difficulty-badge ${selectedQuestion.difficulty.toLowerCase()}`}>
                {selectedQuestion.difficulty}
              </span>
              <p className="question-description">
                {selectedQuestion.description}
              </p>
              <div className="examples">
                <h3>Example:</h3>
                <div className="example-box">
                  <div><strong>Input:</strong> {selectedQuestion.exampleInput}</div>
                  <div><strong>Output:</strong> {selectedQuestion.exampleOutput}</div>
                </div>
              </div>
            </div>

            <div className="code-section">
              <div className="code-header">
                <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
                <div className="code-actions">
                  <button onClick={handleRunCode} disabled={loading}>
                    {loading ? 'Running...' : 'Run Code'}
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="submit-btn">
                    Submit
                  </button>
                </div>
              </div>
              
              <CodeEditor
                code={code}
                setCode={setCode}
                language={language}
              />

              <div className="output-section">
                <h3>Output:</h3>
                <pre className="output-content">{output}</pre>
                
                {testResults && (
                  <div className="test-results">
                    <h3>Test Results:</h3>
                    {testResults.map((result, index) => (
                      <div key={index} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                        <span>Test Case {index + 1}: </span>
                        {result.passed ? '✅ Passed' : '❌ Failed'}
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

export default CodingPractice;
