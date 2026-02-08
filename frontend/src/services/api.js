import axios from 'axios';

const API_BASE_URL=import.meta.env.VITE_API_URL||'http://localhost:5000';

const api=axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interview APIs
export const createInterview=(data) => api.post('/interview/create', data);
export const getInterview=(id) => api.get(`/interview/${id}`);
export const endInterview=(id, data) => api.post(`/interview/${id}/end`, data);
export const addQuestion=(id, question) => api.post(`/interview/${id}/question`, question);
export const addSubmission=(id, submission) => api.post(`/interview/${id}/submission`, submission);

// Question APIs
export const getQuestions=(params) => api.get('/questions', {params});
export const getQuestion=(id) => api.get(`/questions/${id}`);
export const getRandomQuestions=(count) => api.get(`/questions/random/${count}`);
export const createQuestion=(data) => api.post('/questions', data);
export const updateQuestion=(id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion=(id) => api.delete(`/questions/${id}`);

// Code Execution APIs
export const executeCode=(data) => api.post('/code-execution/execute', data);
export const submitCode=(data) => api.post('/code-execution/submit', data);

// Proctoring APIs
export const logProctoringEvent=(data) => api.post('/proctoring/event', data);
export const sendProctoringEvent=(interviewId, event) => api.post('/proctoring/event', {interviewId, event});
export const getProctoringEvents=(interviewId) => api.get(`/proctoring/${interviewId}`);
export const getIntegrityScore=(interviewId) => api.get(`/proctoring/${interviewId}/score`);

// AI APIs
export const generateAIQuestion=(data) => api.post('/ai/generate-question', data);
export const generateQuestion=(data) => api.post('/ai/ask-question', data); // legacy
export const evaluateCode=(data) => api.post('/ai/evaluate-code', data);
export const generateFeedback=(data) => api.post('/ai/generate-feedback', data);
export const interviewChat=(data) => api.post('/ai/interview-chat', data);

export default api;
