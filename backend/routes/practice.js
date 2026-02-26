import express from 'express';
import axios from 'axios';
import PracticeSession from '../models/PracticeSession.js';
import {verifyAuth} from '../middleware/auth.js';
import {APIResponse} from '../middleware/response.js';

const router=express.Router();

const GROQ_TIMEOUT=15000; // 15s timeout for AI calls
const GROQ_URL='https://api.groq.com/openai/v1/chat/completions';

// Helper: make Groq API call with timeout
async function callGroq(messages, {model='llama-3.1-8b-instant', temperature=0.7, max_tokens=1000}={})
{
    const response=await axios.post(
        GROQ_URL,
        {messages, model, temperature, max_tokens},
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            timeout: GROQ_TIMEOUT,
        }
    );
    return response.data.choices[0]?.message?.content||'';
}

// Helper: safely parse JSON from AI response
function safeParseJSON(text)
{
    try
    {
        const cleaned=text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const jsonMatch=cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch
    {
        return null;
    }
}

// Parse AI-generated question response
function parseQuestionResponse(response, interviewType)
{
    try
    {
        const parsed=safeParseJSON(response);
        if (!parsed||!parsed.question) return null;

        if (interviewType==='coding')
        {
            if (!parsed.testCases||!Array.isArray(parsed.testCases)||parsed.testCases.length===0) return null;
            if (!parsed.starterCode||typeof parsed.starterCode!=='object') return null;
            if (!parsed.functionName) return null;
        }

        return {
            question: parsed.question,
            type: interviewType,
            expectedPoints: parsed.expectedPoints||[],
            hints: parsed.hints||[],
            testCases: parsed.testCases,
            starterCode: parsed.starterCode,
            functionName: parsed.functionName,
        };
    } catch (error)
    {
        console.error('[PRACTICE] Parse question error:', error.message);
        return null;
    }
}

// ── Start practice session ──
router.post('/start', verifyAuth, async (req, res) =>
{
    try
    {
        const {sessionId, role, difficulty, interviewType, mode}=req.body;

        if (!sessionId||!role)
        {
            return APIResponse.error(res, 'sessionId and role are required', 400);
        }

        const roleDisplay=role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const questionCount=getModeQuestionCount(mode);

        let greeting=`Hello! I'm your AI interviewer for today's ${interviewType} interview. We'll be assessing your skills for the ${roleDisplay} role. I'll ask you ${questionCount} questions, and feel free to ask for clarification at any time. Let's get started!`;

        try
        {
            const greetingPrompt=`You are conducting a ${interviewType} interview for a ${roleDisplay} position (${difficulty} level).

Create a brief, warm professional greeting (2-3 sentences) that:
- Introduces yourself as the interviewer
- Mentions ${questionCount} questions
- Encourages honest answers

JSON format: {"greeting": "your message"}`;

            const response=await callGroq([
                {role: 'system', content: 'You are a friendly, professional interviewer.'},
                {role: 'user', content: greetingPrompt},
            ], {temperature: 0.8, max_tokens: 250});

            const parsed=safeParseJSON(response);
            if (parsed?.greeting) greeting=parsed.greeting;
        } catch (err)
        {
            console.warn('[PRACTICE] Greeting AI fallback:', err.message);
        }

        // Persist to MongoDB instead of in-memory Map
        const session=await PracticeSession.create({
            sessionId,
            userId: req.user.id,
            role,
            difficulty: difficulty||'medium',
            interviewType: interviewType||'technical',
            mode: mode||'practice',
            status: 'active',
            duration: getModeQuestionCount(mode)*5,
            totalQuestions: questionCount,
            questionsAnswered: 0,
            score: 0,
        });

        return APIResponse.success(res, {sessionId, greeting}, 'Practice session started');
    } catch (error)
    {
        console.error('[PRACTICE] Start error:', error.message, error.stack);
        return APIResponse.serverError(res, 'Failed to start session');
    }
});

// ── Get next question using AI ──
router.post('/next-question', verifyAuth, async (req, res) =>
{
    try
    {
        const {sessionId, previousAnswer}=req.body;

        if (!sessionId)
        {
            return APIResponse.error(res, 'sessionId is required', 400);
        }

        const session=await PracticeSession.findOne({sessionId, userId: req.user.id});
        if (!session)
        {
            return APIResponse.notFound(res, 'Session');
        }

        session.status='active';

        // Adaptive difficulty
        let adjustedDifficulty=session.difficulty;
        let transitionMessage='';

        if (previousAnswer)
        {
            const wasCorrect=previousAnswer.score>=7;
            if (wasCorrect&&session.difficulty==='easy')
            {
                adjustedDifficulty='medium';
                transitionMessage="Great work! Let's challenge you a bit more with the next one.";
            } else if (wasCorrect&&session.difficulty==='medium')
            {
                adjustedDifficulty='hard';
                transitionMessage="Excellent! Here's a more advanced question.";
            } else if (!wasCorrect&&session.difficulty==='hard')
            {
                adjustedDifficulty='medium';
                transitionMessage="Alright, let's try a different approach.";
            } else if (wasCorrect)
            {
                transitionMessage='Good! Moving to the next question.';
            } else
            {
                transitionMessage="I see. Let's continue.";
            }
        } else
        {
            transitionMessage="Let's begin with your first question.";
        }

        const prompt=generateQuestionPrompt(session.role, adjustedDifficulty, session.interviewType, session.questions.length);

        let question=null;
        try
        {
            const response=await callGroq([
                {
                    role: 'system',
                    content: session.interviewType==='coding'
                        ? 'You are an expert coding interviewer. Generate clear, solvable coding problems with correct test cases. Return ONLY valid JSON.'
                        :'You are an expert technical interviewer. Generate interview questions in JSON format.',
                },
                {role: 'user', content: prompt},
            ], {
                temperature: 0.7,
                max_tokens: session.interviewType==='coding'? 1500:1000,
            });

            question=parseQuestionResponse(response, session.interviewType);
        } catch (aiErr)
        {
            console.warn('[PRACTICE] AI question generation failed:', aiErr.message);
        }

        if (!question)
        {
            question=generateFallbackQuestion(session);
        }

        question.questionNumber=session.questions.length+1;
        question.adjustedDifficulty=adjustedDifficulty;

        session.questions.push({
            questionId: `q${question.questionNumber}`,
            question: question.question,
            timestamp: new Date(),
        });
        session.difficulty=adjustedDifficulty;
        await session.save();

        return APIResponse.success(res, {
            question,
            totalQuestions: getModeQuestionCount(session.mode),
            transitionMessage,
            currentDifficulty: adjustedDifficulty,
        });
    } catch (error)
    {
        console.error('[PRACTICE] Next question error:', error.message);

        // Fallback question
        try
        {
            const session=await PracticeSession.findOne({sessionId: req.body.sessionId});
            if (session)
            {
                const fallback=generateFallbackQuestion(session);
                fallback.questionNumber=session.questions.length+1;
                fallback.adjustedDifficulty=session.difficulty;
                session.questions.push({
                    questionId: `q${fallback.questionNumber}`,
                    question: fallback.question,
                    timestamp: new Date(),
                });
                await session.save();
                return APIResponse.success(res, {
                    question: fallback,
                    totalQuestions: getModeQuestionCount(session.mode||'quick'),
                    transitionMessage: 'Next question.',
                    currentDifficulty: session.difficulty,
                });
            }
        } catch { /* ignore fallback error */}

        return APIResponse.serverError(res, 'Failed to generate question');
    }
});

// ── Evaluate answer using AI ──
router.post('/evaluate-answer', verifyAuth, async (req, res) =>
{
    try
    {
        const {sessionId, questionId, answer}=req.body;

        if (!sessionId||!answer)
        {
            return APIResponse.error(res, 'sessionId and answer are required', 400);
        }

        const session=await PracticeSession.findOne({sessionId, userId: req.user.id});
        if (!session)
        {
            return APIResponse.notFound(res, 'Session');
        }

        const question=session.questions.find(q =>
            q.questionId===`q${questionId}`||session.questions.indexOf(q)===questionId-1
        );

        const avgScore=session.responses.length>0
            ? (session.responses.reduce((sum, r) => sum+(r.score||0), 0)/session.responses.length).toFixed(1)
            :'N/A';

        const prompt=`You are interviewing a candidate for ${session.role.replace('-', ' ')} position (${session.difficulty} level).

**Question you asked:** ${question?.question||'Unknown question'}
**Candidate's answer:** ${answer}
**Their average score so far:** ${avgScore}/10

**Evaluation rules:**
1. Score honestly: 1-2 (irrelevant/wrong), 3-4 (very basic), 5-6 (partial understanding), 7-8 (good with minor gaps), 9-10 (excellent)
2. DO NOT reveal correct answers or what they missed
3. Be conversational like a human interviewer
4. Ask a natural follow-up to dig deeper (REQUIRED - never null)
5. Keep feedback brief and encouraging

JSON format:
{
  "score": 7,
  "feedback": "I see you understand the core concept...",
  "strengths": ["Point A", "Point B"],
  "improvements": ["Could elaborate on...", "Consider..."],
  "followUp": "Interesting. Now, can you tell me..."
}`;

        let evaluation=null;
        try
        {
            const response=await callGroq([
                {role: 'system', content: 'You are a professional interviewer. Be conversational, fair, and never reveal answers during the interview.'},
                {role: 'user', content: prompt},
            ], {temperature: 0.6, max_tokens: 700});

            evaluation=safeParseJSON(response);
        } catch (aiErr)
        {
            console.warn('[PRACTICE] AI evaluation failed:', aiErr.message);
        }

        if (!evaluation||typeof evaluation.score!=='number')
        {
            const answerLength=answer.trim().length;
            const score=answerLength<20? 2:answerLength<50? 3:answerLength<150? 5:7;
            evaluation={
                score,
                feedback: answerLength<50? 'Your answer is too brief. Please provide more detail.':'Your answer has been recorded.',
                strengths: answerLength>=50? ['Good effort']:['Attempted the question'],
                improvements: answerLength<100? ['Provide more detail', 'Use specific examples']:['Be more specific'],
                followUp: 'Can you elaborate on how you would apply this in a real-world scenario?',
            };
        }

        // Persist response to MongoDB
        session.responses.push({
            question: question?.question||'Unknown',
            userAnswer: answer,
            score: evaluation.score,
            timestamp: new Date(),
        });
        session.questionsAnswered=session.responses.length;
        await session.save();

        return APIResponse.success(res, {evaluation});
    } catch (error)
    {
        console.error('[PRACTICE] Evaluate error:', error.message);
        return APIResponse.serverError(res, 'Failed to evaluate answer');
    }
});

// ── Finish session and generate feedback ──
router.post('/finish', verifyAuth, async (req, res) =>
{
    try
    {
        const {sessionId}=req.body;

        if (!sessionId)
        {
            return APIResponse.error(res, 'sessionId is required', 400);
        }

        const session=await PracticeSession.findOne({sessionId, userId: req.user.id});
        if (!session)
        {
            return APIResponse.notFound(res, 'Session');
        }

        session.status='completed';
        session.endTime=new Date();

        const responses=session.responses||[];
        const scores={
            technical: calculateTechnicalScore(responses),
            communication: calculateCommunicationScore(responses),
            problemSolving: calculateProblemSolvingScore(responses),
            confidence: calculateConfidenceScore(responses),
        };
        const overallScore=Object.values(scores).reduce((a, b) => a+b, 0)/Object.keys(scores).length;

        let aiFeedback=null;
        try
        {
            const summaryPrompt=`Generate interview feedback report:

Session Type: ${session.interviewType}
Role: ${session.role}
Questions: ${session.questions.length}
Average Score: ${overallScore.toFixed(1)}

Answers summary:
${responses.map((r, i) => `Q${i+1}: Score ${r.score||0}/10`).join('\n')}

Provide comprehensive feedback in JSON:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestedTopics": ["topic 1", "topic 2", "topic 3"],
  "summary": "Overall assessment paragraph"
}`;

            const response=await callGroq([
                {role: 'system', content: 'You are providing final interview feedback. Be encouraging but honest.'},
                {role: 'user', content: summaryPrompt},
            ], {temperature: 0.6, max_tokens: 1200});

            aiFeedback=safeParseJSON(response);
        } catch (aiErr)
        {
            console.warn('[PRACTICE] AI feedback failed:', aiErr.message);
        }

        const feedback={
            sessionId,
            scores,
            overallScore,
            totalQuestions: session.questions.length,
            duration: session.endTime&&session.startTime
                ? Math.floor((session.endTime-session.startTime)/1000/60)
                :0,
            strengths: aiFeedback?.strengths||['Completed the interview', 'Answered all questions'],
            weaknesses: aiFeedback?.weaknesses||['Could provide more detailed responses'],
            suggestedTopics: aiFeedback?.suggestedTopics||['Review core concepts'],
            summary: aiFeedback?.summary||'You completed the practice interview. Keep practicing to improve!',
        };

        session.score=overallScore;
        session.feedback=JSON.stringify(feedback);
        await session.save();

        return APIResponse.success(res, {feedback});
    } catch (error)
    {
        console.error('[PRACTICE] Finish error:', error.message);
        return APIResponse.serverError(res, 'Failed to generate feedback');
    }
});

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

function generateQuestionPrompt(role, difficulty, type, questionNumber)
{
    const roleDescriptions={
        'frontend-developer': 'Frontend Development (React, JavaScript, CSS, HTML)',
        'backend-developer': 'Backend Development (Node.js, APIs, Databases)',
        'fullstack-developer': 'Full Stack Development',
        'data-science': 'Data Science (Python, ML, Statistics)',
        'devops': 'DevOps (CI/CD, Docker, Kubernetes)',
        'mobile-developer': 'Mobile Development (React Native, iOS, Android)',
    };

    const typeDescriptions={
        'technical': 'technical concept question',
        'behavioral': 'behavioral question about past experience',
        'coding': 'coding problem to solve',
        'system-design': 'system design question',
    };

    const roleDisplay=roleDescriptions[role]||role;

    if (type==='coding')
    {
        return `Generate a unique ${difficulty} level coding problem for a ${roleDisplay} interview.

**CRITICAL REQUIREMENTS:**
1. Return ONLY valid JSON - no markdown, no code blocks
2. Problem must be clear and solvable in 10-15 minutes
3. Include 3-4 test cases with correct inputs and outputs
4. Provide starter code for Python, JavaScript, Java
5. Add 2-3 helpful hints

Return ONLY this JSON structure:
{
  "question": "Clear problem description with examples",
  "type": "coding",
  "difficulty": "${difficulty}",
  "expectedPoints": ["Key concept 1", "Key concept 2"],
  "hints": ["Hint 1", "Hint 2"],
  "testCases": [{"input": {"nums": [1,2,3]}, "output": [0,2], "hidden": false}],
  "starterCode": {"python": "def fn():\\n    pass", "javascript": "function fn() {}", "java": "class Solution {}"},
  "functionName": "function_name"
}`;
    }

    return `Generate interview question #${questionNumber+1} for a ${roleDisplay} position.
Type: ${typeDescriptions[type]||type}
Difficulty: ${difficulty}

Return ONLY valid JSON:
{
  "question": "The interview question",
  "type": "${type}",
  "expectedPoints": ["key point 1", "key point 2", "key point 3"],
  "hints": ["hint 1", "hint 2"]
}`;
}

function generateFallbackQuestion(session)
{
    const roleQuestions={
        'frontend-developer': {
            technical: {question: 'Explain the Virtual DOM in React and why it improves performance.', expectedPoints: ['Diffing algorithm', 'Batch updates', 'Reconciliation'], hints: ['Think about DOM manipulation cost', 'Consider update batching']},
            behavioral: {question: 'Describe a time you optimized a slow frontend application.', expectedPoints: ['Identified bottleneck', 'Solution implemented', 'Results measured'], hints: ['Use STAR method']},
            coding: {question: 'Write a function to debounce user input.', expectedPoints: ['Closure usage', 'Timeout management'], hints: ['Use setTimeout and clearTimeout'], testCases: [{input: {delay: 100}, output: 1, hidden: false}], starterCode: {python: 'def debounce(func, delay):\n    pass', javascript: 'function debounce(func, delay) {}', java: 'class Solution {}'}, functionName: 'debounce'},
        },
        'backend-developer': {
            technical: {question: 'Explain RESTful API design principles and best practices.', expectedPoints: ['HTTP methods', 'Resource naming', 'Status codes'], hints: ['Think about statelessness']},
            behavioral: {question: 'Tell me about a time you designed a scalable backend system.', expectedPoints: ['Architecture decisions', 'Scaling strategy', 'Results'], hints: ['Use STAR method']},
            coding: {question: 'Implement a rate limiter that allows at most N requests per time window.', expectedPoints: ['Sliding window', 'Timestamp tracking'], hints: ['Use a queue to track timestamps'], testCases: [{input: {maxRequests: 3}, output: true, hidden: false}], starterCode: {python: 'class RateLimiter:\n    pass', javascript: 'class RateLimiter {}', java: 'class RateLimiter {}'}, functionName: 'RateLimiter'},
        },
        'data-science': {
            technical: {question: 'Explain the bias-variance tradeoff in machine learning.', expectedPoints: ['Underfitting vs overfitting', 'Model complexity'], hints: ['Think about model complexity']},
            behavioral: {question: 'Describe a challenging data analysis project.', expectedPoints: ['Problem definition', 'Methodology', 'Insights'], hints: ['Use STAR method']},
            coding: {question: 'Implement a function to calculate Euclidean distance in N-dimensional space.', expectedPoints: ['Square of differences', 'Sum and square root'], hints: ['Formula: sqrt(sum((x[i]-y[i])^2))'], testCases: [{input: {p1: [0, 0], p2: [3, 4]}, output: 5.0, hidden: false}], starterCode: {python: 'def euclidean_distance(p1, p2):\n    pass', javascript: 'function euclideanDistance(p1, p2) {}', java: 'class Solution {}'}, functionName: 'euclidean_distance'},
        },
        'fullstack-developer': {
            technical: {question: 'How would you optimize a full-stack application for performance?', expectedPoints: ['Frontend optimization', 'Backend optimization', 'Database tuning'], hints: ['Think about caching']},
            behavioral: {question: 'Tell me about a feature you built end-to-end.', expectedPoints: ['Planning', 'Implementation', 'Deployment'], hints: ['Use STAR method']},
            coding: {question: 'Implement a function to validate a JWT structure.', expectedPoints: ['Split by dot', 'Check three parts'], hints: ['JWT format: header.payload.signature'], testCases: [{input: {token: 'a.b.c'}, output: true, hidden: false}], starterCode: {python: 'def validate_jwt(token):\n    pass', javascript: 'function validateJwt(token) {}', java: 'class Solution {}'}, functionName: 'validate_jwt'},
        },
        'devops': {
            technical: {question: 'Explain CI/CD pipelines and their benefits.', expectedPoints: ['Continuous integration', 'Continuous deployment', 'Automation'], hints: ['Think about testing']},
            behavioral: {question: 'Describe a time you automated a manual process.', expectedPoints: ['Problem identified', 'Solution implemented', 'Time saved'], hints: ['Use STAR method']},
            coding: {question: 'Write a function to parse environment variables from KEY=VALUE format.', expectedPoints: ['Split by newline', 'Split by equals'], hints: ['Handle empty lines and comments'], testCases: [{input: {env: 'PORT=3000'}, output: {PORT: '3000'}, hidden: false}], starterCode: {python: 'def parse_env(s):\n    pass', javascript: 'function parseEnv(s) {}', java: 'class Solution {}'}, functionName: 'parse_env'},
        },
        'mobile-developer': {
            technical: {question: 'Explain the mobile app lifecycle and state management.', expectedPoints: ['Lifecycle methods', 'State persistence'], hints: ['Think about memory constraints']},
            behavioral: {question: 'Tell me about a mobile app feature you built.', expectedPoints: ['Platform choice', 'Implementation', 'User feedback'], hints: ['Use STAR method']},
            coding: {question: 'Calculate scroll percentage given position and total height.', expectedPoints: ['Division', 'Percentage', 'Edge cases'], hints: ['Handle divide by zero'], testCases: [{input: {pos: 250, total: 1000}, output: 25.0, hidden: false}], starterCode: {python: 'def scroll_pct(pos, total):\n    pass', javascript: 'function scrollPct(pos, total) {}', java: 'class Solution {}'}, functionName: 'scroll_pct'},
        },
    };

    const roleKey=session.role||'frontend-developer';
    const typeKey=session.interviewType||'technical';
    const roleSpecific=roleQuestions[roleKey]?.[typeKey];

    if (roleSpecific)
    {
        const result={question: roleSpecific.question, type: typeKey, expectedPoints: roleSpecific.expectedPoints, hints: roleSpecific.hints};
        if (typeKey==='coding'&&roleSpecific.testCases)
        {
            result.testCases=roleSpecific.testCases;
            result.starterCode=roleSpecific.starterCode;
            result.functionName=roleSpecific.functionName;
        }
        return result;
    }

    return {question: 'Describe your experience and key skills in your field.', type: typeKey, expectedPoints: ['Relevant experience', 'Technical skills', 'Projects'], hints: ['Be specific', 'Use examples']};
}

function getModeQuestionCount(mode)
{
    const counts={quick: 5, real: 12, coding: 3, practice: 5, mock: 8, full: 12};
    return counts[mode]||5;
}

function calculateTechnicalScore(responses)
{
    if (responses.length===0) return 0;
    return responses.reduce((sum, r) => sum+(r.score||0), 0)/responses.length;
}

function calculateCommunicationScore(responses)
{
    if (responses.length===0) return 0;
    const avgScore=responses.reduce((sum, r) => sum+(r.score||0), 0)/responses.length;
    const avgLength=responses.reduce((sum, r) => sum+(r.userAnswer?.length||0), 0)/responses.length;
    const lengthScore=Math.min(10, (avgLength/200)*10);
    return avgScore*0.6+lengthScore*0.4;
}

function calculateProblemSolvingScore(responses)
{
    return calculateTechnicalScore(responses);
}

function calculateConfidenceScore(responses)
{
    if (responses.length===0) return 0;
    return responses.reduce((sum, r) => sum+((r.score||0)>=7? 8:6), 0)/responses.length;
}

export default router;
