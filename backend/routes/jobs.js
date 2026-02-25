import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import {verifyAuth, verifyAuthOptional, verifyRole} from '../middleware/auth.js';
import {APIResponse} from '../middleware/response.js';

const router=express.Router();

/* ═══════════════════════════════════════════════════════════════════
   JOB ROUTES (Company-side)
   ═══════════════════════════════════════════════════════════════════ */

// Create a new job posting
router.post('/', verifyAuth, async (req, res) =>
{
  try
  {
    const {title, department, location, type, description, requirements, skills, userId, companyName}=req.body;

    if (!title||!department)
    {
      return res.status(400).json({message: 'Title and department are required'});
    }

    if (!userId)
    {
      return res.status(401).json({message: 'User ID is required'});
    }

    // Verify the user is a company role
    const user=await User.findById(userId);
    if (!user||!['company_admin', 'company_hr', 'recruiter'].includes(user.role))
    {
      return res.status(403).json({message: 'Only company users can post jobs'});
    }

    const job=await Job.create({
      title,
      department,
      location: location||'Remote',
      type: type||'Full-Time',
      description: description||'',
      requirements: requirements||'',
      skills: skills||[],
      postedBy: userId,
      companyName: companyName||user.companyName||user.username,
      status: 'active',
    });

    console.log(`[JOBS] ✅ Job posted: "${title}" by ${user.username}`);

    return res.status(201).json({
      message: 'Job posted successfully',
      job: {
        id: job._id,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        companyName: job.companyName,
        status: job.status,
        applicantCount: 0,
        createdAt: job.createdAt,
      },
    });
  } catch (err)
  {
    console.error('[JOBS] Post error:', err);
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get all jobs for a company (by userId)
router.get('/company/:userId', verifyAuth, async (req, res) =>
{
  try
  {
    const jobs=await Job.find({postedBy: req.params.userId})
      .sort({createdAt: -1})
      .lean();

    const jobsWithApplicants=await Promise.all(
      jobs.map(async (job) =>
      {
        const applicantCount=await Application.countDocuments({job: job._id});
        return {
          id: job._id,
          title: job.title,
          department: job.department,
          location: job.location,
          type: job.type,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          companyName: job.companyName,
          status: job.status,
          applicantCount,
          createdAt: job.createdAt,
        };
      })
    );

    return res.json({jobs: jobsWithApplicants});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get all active jobs (for candidates to browse)
router.get('/browse', verifyAuthOptional, async (req, res) =>
{
  try
  {
    const {search, location, type, department}=req.query;
    const filter={status: 'active'};

    if (search)
    {
      filter.$or=[
        {title: {$regex: search, $options: 'i'}},
        {description: {$regex: search, $options: 'i'}},
        {companyName: {$regex: search, $options: 'i'}},
        {department: {$regex: search, $options: 'i'}},
      ];
    }
    if (location&&location!=='All') filter.location=location;
    if (type&&type!=='All') filter.type=type;
    if (department) filter.department={$regex: department, $options: 'i'};

    const jobs=await Job.find(filter)
      .sort({createdAt: -1})
      .lean();

    const jobsWithApplicants=jobs.map((job) => ({
      id: job._id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills,
      companyName: job.companyName,
      status: job.status,
      applicantCount: job.applicantCount||0,
      createdAt: job.createdAt,
    }));

    return res.json({jobs: jobsWithApplicants});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get single job details
router.get('/:jobId', verifyAuthOptional, async (req, res) =>
{
  try
  {
    const job=await Job.findById(req.params.jobId).lean();
    if (!job) return res.status(404).json({message: 'Job not found'});

    const applicantCount=await Application.countDocuments({job: job._id});

    return res.json({
      id: job._id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills,
      companyName: job.companyName,
      status: job.status,
      applicantCount,
      createdAt: job.createdAt,
    });
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Update job status
router.put('/:jobId', verifyAuth, async (req, res) =>
{
  try
  {
    const {status, title, department, location, type, description, requirements}=req.body;
    const update={};
    if (status) update.status=status;
    if (title) update.title=title;
    if (department) update.department=department;
    if (location) update.location=location;
    if (type) update.type=type;
    if (description!==undefined) update.description=description;
    if (requirements!==undefined) update.requirements=requirements;

    const job=await Job.findByIdAndUpdate(req.params.jobId, update, {new: true});
    if (!job) return res.status(404).json({message: 'Job not found'});

    return res.json({message: 'Job updated', job});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Delete job
router.delete('/:jobId', verifyAuth, async (req, res) =>
{
  try
  {
    await Job.findByIdAndDelete(req.params.jobId);
    await Application.deleteMany({job: req.params.jobId});
    return res.json({message: 'Job deleted'});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

/* ═══════════════════════════════════════════════════════════════════
   APPLICATION ROUTES (Candidate-side)
   ═══════════════════════════════════════════════════════════════════ */

// Apply to a job
router.post('/:jobId/apply', verifyAuth, async (req, res) =>
{
  try
  {
    const {candidateId, coverLetter}=req.body;
    const {jobId}=req.params;

    if (!candidateId)
    {
      return res.status(401).json({message: 'Candidate ID is required'});
    }

    const job=await Job.findById(jobId);
    if (!job) return res.status(404).json({message: 'Job not found'});
    if (job.status!=='active') return res.status(400).json({message: 'This job is no longer accepting applications'});

    // Check for duplicate application
    const existing=await Application.findOne({job: jobId, candidate: candidateId});
    if (existing)
    {
      return res.status(400).json({message: 'You have already applied to this job'});
    }

    const application=await Application.create({
      job: jobId,
      candidate: candidateId,
      coverLetter: coverLetter||'',
      status: 'applied',
      round: 'Applied',
    });

    // Increment applicant count
    await Job.findByIdAndUpdate(jobId, {$inc: {applicantCount: 1}});

    console.log(`[JOBS] ✅ Application submitted for job "${job.title}" by candidate ${candidateId}`);

    return res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: application._id,
        jobId: application.job,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (err)
  {
    if (err.code===11000)
    {
      return res.status(400).json({message: 'You have already applied to this job'});
    }
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get candidate's applications
router.get('/applications/:candidateId', verifyAuth, async (req, res) =>
{
  try
  {
    const applications=await Application.find({candidate: req.params.candidateId})
      .populate('job', 'title department location type companyName status createdAt')
      .sort({createdAt: -1})
      .lean();

    const result=applications.map((app) => ({
      id: app._id,
      status: app.status,
      round: app.round,
      score: app.score,
      appliedAt: app.createdAt,
      job: app.job? {
        id: app.job._id,
        title: app.job.title,
        department: app.job.department,
        location: app.job.location,
        type: app.job.type,
        companyName: app.job.companyName,
        status: app.job.status,
      }:null,
    }));

    return res.json({applications: result});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get applicants for a job (company-side)
router.get('/:jobId/applicants', verifyAuth, async (req, res) =>
{
  try
  {
    const applications=await Application.find({job: req.params.jobId})
      .populate('candidate', 'username email skills bio createdAt')
      .sort({createdAt: -1})
      .lean();

    const result=applications.map((app) => ({
      id: app._id,
      status: app.status,
      round: app.round,
      score: app.score,
      appliedAt: app.createdAt,
      candidate: app.candidate? {
        id: app.candidate._id,
        name: app.candidate.username,
        email: app.candidate.email,
        skills: app.candidate.skills,
        bio: app.candidate.bio,
      }:null,
    }));

    return res.json({applicants: result});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Update application status (company-side)
router.put('/applications/:applicationId', verifyAuth, async (req, res) =>
{
  try
  {
    const {status, round, score, notes}=req.body;
    const update={};
    if (status) update.status=status;
    if (round) update.round=round;
    if (score!==undefined) update.score=score;
    if (notes!==undefined) update.notes=notes;

    const application=await Application.findByIdAndUpdate(req.params.applicationId, update, {new: true});
    if (!application) return res.status(404).json({message: 'Application not found'});

    return res.json({message: 'Application updated', application});
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get candidate dashboard stats
router.get('/stats/:candidateId', verifyAuth, async (req, res) =>
{
  try
  {
    const candidateId=req.params.candidateId;

    const [totalApplied, inProgress, pending, totalJobs, shortlisted, selected]=await Promise.all([
      Application.countDocuments({candidate: candidateId}),
      Application.countDocuments({candidate: candidateId, status: {$in: ['screening', 'interview', 'assessment']}}),
      Application.countDocuments({candidate: candidateId, status: 'applied'}),
      Job.countDocuments({status: 'active'}),
      Application.countDocuments({candidate: candidateId, status: 'shortlisted'}),
      Application.countDocuments({candidate: candidateId, status: {$in: ['selected', 'offered', 'hired']}}),
    ]);

    return res.json({
      applied: totalApplied,
      assessments: inProgress,
      pending,
      availableJobs: totalJobs,
      shortlisted,
      selected,
    });
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

/* ═══════════════════════════════════════════════════════════════════
   KANBAN ROUTES (Candidate-side grouped by status)
   ═══════════════════════════════════════════════════════════════════ */

// Get Kanban-grouped applications for a candidate
router.get('/kanban/:candidateId', verifyAuth, async (req, res) =>
{
  try
  {
    const candidateId=req.params.candidateId;

    const applications=await Application.find({candidate: candidateId})
      .populate('job', 'title department location type companyName status createdAt skills salary description')
      .sort({createdAt: -1})
      .lean();

    // Group applications by Kanban columns
    const kanban={
      applied: [],
      shortlisted: [],
      selected: [],
      rejected: [],
    };

    applications.forEach(app =>
    {
      const item={
        id: app._id,
        status: app.status,
        round: app.round,
        score: app.score,
        notes: app.notes,
        appliedAt: app.appliedAt||app.createdAt,
        shortlistedAt: app.shortlistedAt,
        selectedAt: app.selectedAt,
        statusHistory: app.statusHistory||[],
        job: app.job? {
          id: app.job._id,
          title: app.job.title,
          department: app.job.department,
          location: app.job.location,
          type: app.job.type,
          companyName: app.job.companyName,
          status: app.job.status,
          skills: app.job.skills||[],
          salary: app.job.salary,
          description: app.job.description,
          createdAt: app.job.createdAt,
        }:null,
      };

      if (['applied', 'screening'].includes(app.status))
      {
        kanban.applied.push(item);
      } else if (['shortlisted', 'interview', 'assessment'].includes(app.status))
      {
        kanban.shortlisted.push(item);
      } else if (['selected', 'offered', 'hired'].includes(app.status))
      {
        kanban.selected.push(item);
      } else if (['rejected', 'withdrawn'].includes(app.status))
      {
        kanban.rejected.push(item);
      } else
      {
        kanban.applied.push(item);
      }
    });

    return res.json({
      kanban,
      counts: {
        applied: kanban.applied.length,
        shortlisted: kanban.shortlisted.length,
        selected: kanban.selected.length,
        rejected: kanban.rejected.length,
        total: applications.length,
      },
    });
  } catch (err)
  {
    console.error('[JOBS] Kanban error:', err);
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Update application status (company-side — for Kanban management)
router.put('/applications/:applicationId/status', verifyAuth, async (req, res) =>
{
  try
  {
    const {status, note, changedBy}=req.body;
    if (!status) return res.status(400).json({message: 'Status is required'});

    const validStatuses=['applied', 'shortlisted', 'selected', 'screening', 'interview', 'assessment', 'offered', 'hired', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status))
    {
      return res.status(400).json({message: 'Invalid status'});
    }

    const application=await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({message: 'Application not found'});

    const oldStatus=application.status;
    application.status=status;

    // Set timestamps for Kanban columns
    if (status==='shortlisted'&&!application.shortlistedAt)
    {
      application.shortlistedAt=new Date();
    }
    if (['selected', 'offered', 'hired'].includes(status)&&!application.selectedAt)
    {
      application.selectedAt=new Date();
    }

    // Add to status history
    if (!application.statusHistory) application.statusHistory=[];
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: changedBy||null,
      note: note||`Status changed from ${oldStatus} to ${status}`,
    });

    await application.save();

    console.log(`[JOBS] ✅ Application ${application._id} status: ${oldStatus} → ${status}`);

    return res.json({
      message: 'Application status updated',
      application: {
        id: application._id,
        status: application.status,
        shortlistedAt: application.shortlistedAt,
        selectedAt: application.selectedAt,
        statusHistory: application.statusHistory,
      },
    });
  } catch (err)
  {
    console.error('[JOBS] Status update error:', err);
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

// Get company dashboard stats
router.get('/company-stats/:userId', verifyAuth, async (req, res) =>
{
  try
  {
    const userId=req.params.userId;

    const jobs=await Job.find({postedBy: userId}).lean();
    const jobIds=jobs.map(j => j._id);

    const [totalApplicants, inInterview, offered, hired]=await Promise.all([
      Application.countDocuments({job: {$in: jobIds}}),
      Application.countDocuments({job: {$in: jobIds}, status: 'interview'}),
      Application.countDocuments({job: {$in: jobIds}, status: 'offered'}),
      Application.countDocuments({job: {$in: jobIds}, status: 'hired'}),
    ]);

    return res.json({
      activeJobs: jobs.filter(j => j.status==='active').length,
      totalApplicants,
      inInterview,
      offered,
      hired,
    });
  } catch (err)
  {
    return res.status(500).json({message: `Server error: ${err.message}`});
  }
});

export default router;
