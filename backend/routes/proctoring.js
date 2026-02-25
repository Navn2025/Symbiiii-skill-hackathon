import express from 'express';
import InterviewProctoring from '../models/InterviewProctoring.js';
import {verifyAuth} from '../middleware/auth.js';
import {APIResponse} from '../middleware/response.js';
import {validateRequest, proctoringSchemas} from '../middleware/validation.js';

const router=express.Router();

// Severity deduction weights (diminishing returns to prevent score going negative too fast)
const SEVERITY_WEIGHTS={
    low: {base: 1, max: 10},      // max 10 pts deducted from low events
    medium: {base: 3, max: 20},   // max 20 pts deducted from medium events
    high: {base: 7, max: 25},     // max 25 pts deducted from high events
    critical: {base: 15, max: 30}, // max 30 pts deducted from critical events
};

// Calculate integrity score with diminishing returns per severity
function calculateIntegrityScore(events)
{
    const severityCounts={low: 0, medium: 0, high: 0, critical: 0};
    events.forEach(e =>
    {
        if (severityCounts[e.severity]!==undefined) severityCounts[e.severity]++;
    });

    let totalDeduction=0;
    for (const [severity, count] of Object.entries(severityCounts))
    {
        const w=SEVERITY_WEIGHTS[severity];
        // Diminishing returns: each additional event of same severity deducts less
        const deduction=Math.min(w.max, w.base*count*(1-count*0.02));
        totalDeduction+=Math.max(0, deduction);
    }

    return Math.max(0, Math.round(100-totalDeduction));
}

// ── Log proctoring event ──
router.post('/event', verifyAuth, validateRequest(proctoringSchemas.recordEvent), async (req, res) =>
{
    try
    {
        const {interviewId, eventType, severity, details, description}=req.validatedData||req.body;

        if (!interviewId)
        {
            return APIResponse.error(res, 'interviewId is required', 400);
        }

        // Find or create proctoring record
        let proctoring=await InterviewProctoring.findOne({interviewId});
        if (!proctoring)
        {
            proctoring=await InterviewProctoring.create({
                interviewId,
                userId: req.user.userId,
                status: 'in_progress',
            });
        }

        const event={
            eventType,
            severity: severity||'low',
            description: description||details||'',
            timestamp: new Date(),
            metadata: req.body.metadata||{},
        };

        proctoring.events.push(event);
        proctoring.violationCount=proctoring.events.filter(e => ['high', 'critical'].includes(e.severity)).length;
        proctoring.warningCount=proctoring.events.filter(e => e.severity==='medium').length;
        proctoring.integrityScore=calculateIntegrityScore(proctoring.events);

        // Track specific event types
        if (eventType==='face_not_detected') proctoring.faceLostCount++;
        if (eventType==='multiple_faces') proctoring.multipleFaces=true;
        if (eventType==='noise_detected') proctoring.environmentnoise=true;
        if (eventType==='window_blur') proctoring.windowBlurCount++;
        if (eventType==='suspicious_activity') proctoring.suspiciousActivity=true;

        // Auto-flag if critical threshold reached
        if (proctoring.integrityScore<40&&!proctoring.isFlagged)
        {
            proctoring.isFlagged=true;
            proctoring.flagReason='Integrity score dropped below 40';
            proctoring.requiresReview=true;
        }

        await proctoring.save();

        return APIResponse.success(res, {event, integrityScore: proctoring.integrityScore});
    } catch (error)
    {
        console.error('[PROCTORING] Event error:', error.message);
        return APIResponse.serverError(res, 'Failed to record event');
    }
});

// ── Register/update active session ──
router.post('/session', verifyAuth, async (req, res) =>
{
    try
    {
        const {interviewId, candidateName, candidateEmail, recruiterName, startTime}=req.body;

        if (!interviewId)
        {
            return APIResponse.error(res, 'interviewId is required', 400);
        }

        let proctoring=await InterviewProctoring.findOne({interviewId});
        if (!proctoring)
        {
            proctoring=await InterviewProctoring.create({
                interviewId,
                userId: req.user.userId,
                status: 'in_progress',
                startTime: startTime||new Date(),
            });
        } else
        {
            proctoring.status='in_progress';
            await proctoring.save();
        }

        return APIResponse.success(res, {interviewId, status: 'active'});
    } catch (error)
    {
        console.error('[PROCTORING] Session error:', error.message);
        return APIResponse.serverError(res, 'Failed to register session');
    }
});

// ── End session ──
router.delete('/session/:interviewId', verifyAuth, async (req, res) =>
{
    try
    {
        const proctoring=await InterviewProctoring.findOne({interviewId: req.params.interviewId});
        if (proctoring)
        {
            proctoring.status='completed';
            proctoring.endTime=new Date();
            await proctoring.save();
        }
        return APIResponse.success(res, {success: true});
    } catch (error)
    {
        console.error('[PROCTORING] End session error:', error.message);
        return APIResponse.serverError(res, 'Failed to end session');
    }
});

// ── Get all active sessions (for proctor dashboard) ──
// IMPORTANT: Must be defined BEFORE /:interviewId to avoid route shadowing
router.get('/dashboard/sessions', verifyAuth, async (req, res) =>
{
    try
    {
        const sessions=await InterviewProctoring.find({status: 'in_progress'})
            .sort({createdAt: -1})
            .lean();

        const result=sessions.map(session =>
        {
            const violations={
                low: session.events.filter(e => e.severity==='low').length,
                medium: session.events.filter(e => e.severity==='medium').length,
                high: session.events.filter(e => e.severity==='high').length,
                critical: session.events.filter(e => e.severity==='critical').length,
            };

            const duration=Math.floor((new Date()-new Date(session.startTime||session.createdAt))/1000/60);

            return {
                interviewId: session.interviewId,
                candidateName: session.userId?.username||'Unknown',
                candidateEmail: session.userId?.email||'',
                status: session.status,
                startTime: session.startTime||session.createdAt,
                lastActivity: session.events.length>0
                    ? session.events[session.events.length-1].timestamp
                    :session.startTime||session.createdAt,
                integrityScore: session.integrityScore,
                violations,
                totalEvents: session.events.length,
                duration,
                isFlagged: session.isFlagged,
                recentEvents: session.events.slice(-5),
            };
        });

        return APIResponse.success(res, result);
    } catch (error)
    {
        console.error('[PROCTORING] Dashboard error:', error.message);
        return APIResponse.serverError(res, 'Failed to get sessions');
    }
});

// ── Get session details for dashboard ──
router.get('/dashboard/:interviewId', verifyAuth, async (req, res) =>
{
    try
    {
        const proctoring=await InterviewProctoring.findOne({interviewId: req.params.interviewId});

        if (!proctoring)
        {
            return APIResponse.notFound(res, 'Session');
        }

        return APIResponse.success(res, {
            session: proctoring,
            events: proctoring.events,
            eventCount: proctoring.events.length,
            integrityScore: proctoring.integrityScore,
        });
    } catch (error)
    {
        console.error('[PROCTORING] Dashboard detail error:', error.message);
        return APIResponse.serverError(res, 'Failed to get session details');
    }
});

// ── Get events for interview ──
// IMPORTANT: Wildcard routes must come AFTER specific routes
router.get('/:interviewId', verifyAuth, async (req, res) =>
{
    try
    {
        const proctoring=await InterviewProctoring.findOne({interviewId: req.params.interviewId});
        if (!proctoring)
        {
            return APIResponse.success(res, []);
        }
        return APIResponse.success(res, proctoring.events);
    } catch (error)
    {
        console.error('[PROCTORING] Get events error:', error.message);
        return APIResponse.serverError(res, 'Failed to get events');
    }
});

// ── Get integrity score ──
router.get('/:interviewId/score', verifyAuth, async (req, res) =>
{
    try
    {
        const proctoring=await InterviewProctoring.findOne({interviewId: req.params.interviewId});
        if (!proctoring)
        {
            return APIResponse.success(res, {score: 100, totalEvents: 0, breakdown: {}});
        }

        const breakdown={};
        proctoring.events.forEach(event =>
        {
            breakdown[event.eventType]=(breakdown[event.eventType]||0)+1;
        });

        return APIResponse.success(res, {
            score: proctoring.integrityScore,
            totalEvents: proctoring.events.length,
            breakdown,
            isFlagged: proctoring.isFlagged,
            violationCount: proctoring.violationCount,
            warningCount: proctoring.warningCount,
        });
    } catch (error)
    {
        console.error('[PROCTORING] Score error:', error.message);
        return APIResponse.serverError(res, 'Failed to get score');
    }
});

// ── Flag session for review ──
router.post('/:interviewId/flag', verifyAuth, async (req, res) =>
{
    try
    {
        const {reason, severity}=req.body;
        const proctoring=await InterviewProctoring.findOne({interviewId: req.params.interviewId});

        if (!proctoring)
        {
            return APIResponse.notFound(res, 'Session');
        }

        proctoring.isFlagged=true;
        proctoring.flagReason=reason||'Manually flagged for review';
        proctoring.requiresReview=true;
        proctoring.proctoredBy=req.user.userId;
        await proctoring.save();

        return APIResponse.success(res, {message: 'Session flagged for review'});
    } catch (error)
    {
        console.error('[PROCTORING] Flag error:', error.message);
        return APIResponse.serverError(res, 'Failed to flag session');
    }
});

export default router;
