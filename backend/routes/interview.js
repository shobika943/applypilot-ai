import { Router } from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import InterviewGuide from "../models/InterviewGuide.js";
import { requireAuth } from "../middleware/auth.js";
import { callClaudeJSON } from "../utils/aiClient.js";

const router = Router();

// POST /api/interview/generate/:applicationId
// Builds the 50-100 question interview-preparation guide from the JD + resume.
router.post("/generate/:applicationId", requireAuth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ error: "Application not found" });

    const job = await Job.findById(application.job);
    const user = await User.findById(application.user);

    const questionCount = req.body.questionCount || 60; // 50-100 recommended

    const guideData = await callClaudeJSON({
      system: `You are an expert technical interview coach. You generate a personalized,
JD-specific interview preparation guide with real, interview-ready answers — not vague summaries.`,
      prompt: `Generate an interview preparation guide with about ${questionCount} questions
based on this Job Description and this candidate's resume.

Categories to use: "Technical", "Project-Based", "Scenario-Based", "HR/Behavioral", "Skill-Gap".
Bucket each question into one of: "Must Prepare" (directly from the JD's core requirements),
"Should Prepare" (based on the candidate's own resume/projects), or
"Additional Preparation" (JD skills the resume doesn't show yet).

Return JSON exactly in this shape:
{
  "totalQuestions": <int>,
  "breakdown": {"technical": <int>, "projectBased": <int>, "scenarioBased": <int>, "hrBehavioral": <int>, "skillGap": <int>},
  "questions": [
    {
      "question": "...",
      "answer": "...(a full, interview-ready answer, a few sentences to a short paragraph)",
      "category": "Technical",
      "difficulty": "Easy",
      "priority": "High",
      "whyItMatters": "...(one sentence tying it to the JD or resume)",
      "bucket": "Must Prepare"
    }
  ]
}

JOB DESCRIPTION (${job.title} at ${job.company}):
${job.description}

CANDIDATE RESUME:
${user.resumeText.slice(0, 12000)}`,
      maxTokens: 8000,
    });

    const guide = await InterviewGuide.create({
      application: application._id,
      totalQuestions: guideData.totalQuestions,
      breakdown: guideData.breakdown,
      questions: guideData.questions,
    });

    application.status = "prepping";
    await application.save();

    res.status(201).json(guide);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:applicationId", requireAuth, async (req, res) => {
  const guide = await InterviewGuide.findOne({ application: req.params.applicationId });
  if (!guide) return res.status(404).json({ error: "No guide generated yet" });
  res.json(guide);
});

export default router;
