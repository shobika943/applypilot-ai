import { Router } from "express";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import { requireAuth } from "../middleware/auth.js";
import { callClaudeJSON } from "../utils/aiClient.js";

const router = Router();

// ============================================================
// GET APPLICATION
// ============================================================

// GET /api/match/:jobId
//
// Fetch the existing application for this
// job + logged-in user.
//
// Returns:
//   application object
//   OR null
//
router.get(
  "/:jobId",
  requireAuth,
  async (req, res) => {
    try {
      const application =
        await Application.findOne({
          user: req.userId,
          job: req.params.jobId,
        });

      res.json(application);
    } catch (err) {
      res.status(500).json({
        error:
          err.message ||
          "Unable to fetch application",
      });
    }
  }
);

// ============================================================
// MATCH JOB
// ============================================================

// POST /api/match/:jobId
//
// Computes:
// - Match score
// - Matched skills
// - Skill gaps
// - Required skills
//
// Creates or updates Application.
//
router.post(
  "/:jobId",
  requireAuth,
  async (req, res) => {
    try {
      const job =
        await Job.findById(
          req.params.jobId
        );

      const user =
        await User.findById(
          req.userId
        );

      if (!job) {
        return res.status(404).json({
          error: "Job not found",
        });
      }

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (!user.resumeText) {
        return res.status(400).json({
          error:
            "Upload a resume first",
        });
      }

      const result =
        await callClaudeJSON({
          system:
            "You are an ATS-style resume-to-job-description matcher. You compare a resume against a job description and output a match score and skill analysis.",

          prompt: `Compare this RESUME against this JOB DESCRIPTION.

Return JSON exactly like:

{
  "matchScore": <0-100 integer>,
  "matchedSkills": ["skill", ...],
  "skillGaps": ["skill", ...],
  "requiredSkills": ["skill", ...]
}

JOB DESCRIPTION:
${job.description}

RESUME:
${user.resumeText.slice(
  0,
  12000
)}`,
        });

      // Update required skills on the job.
      if (
        result.requiredSkills?.length
      ) {
        job.requiredSkills =
          result.requiredSkills;

        await job.save();
      }

      // Create/update application.
      const application =
        await Application.findOneAndUpdate(
          {
            user: user._id,
            job: job._id,
          },
          {
            user: user._id,
            job: job._id,

            matchScore:
              result.matchScore,

            matchedSkills:
              result.matchedSkills ||
              [],

            skillGaps:
              result.skillGaps ||
              [],
          },
          {
            upsert: true,
            new: true,
          }
        );

      res.json(application);
    } catch (err) {
      res.status(500).json({
        error:
          err.message ||
          "Unable to calculate job match",
      });
    }
  }
);

// ============================================================
// CLICK APPLY
// ============================================================

// POST /api/match/:jobId/click-apply
//
// Called when the user clicks:
//
// "Apply on original listing"
//
// This DOES NOT mean that the user applied.
//
// It only records the click.
//
// Status:
//   saved
//
router.post(
  "/:jobId/click-apply",
  requireAuth,
  async (req, res) => {
    try {
      const application =
        await Application.findOneAndUpdate(
          {
            user: req.userId,
            job: req.params.jobId,
          },
          {
            user: req.userId,
            job: req.params.jobId,

            status: "saved",

            clickedApplyAt:
              new Date(),
          },
          {
            upsert: true,
            new: true,
          }
        );

      res.json(application);
    } catch (err) {
      res.status(500).json({
        error:
          err.message ||
          "Unable to record application click",
      });
    }
  }
);

// ============================================================
// CONFIRM APPLICATION
// ============================================================

// POST /api/match/:jobId/confirm
//
// Body:
//
// {
//   "applied": true
// }
//
// OR:
//
// {
//   "applied": false
// }
//
// If true:
//   status = applied
//   appliedAt = current date
//
// If false:
//   status = saved
//
// IMPORTANT:
// This endpoint returns the COMPLETE Application object
// so the frontend receives application._id.
//
// The frontend then uses that ID to generate the
// interview preparation guide.
//
router.post(
  "/:jobId/confirm",
  requireAuth,
  async (req, res) => {
    try {
      const {
        applied,
      } = req.body;

      // Validate boolean.
      if (
        typeof applied !==
        "boolean"
      ) {
        return res.status(400).json({
          error:
            "The 'applied' field must be true or false.",
        });
      }

      const update = applied
        ? {
            status: "applied",
            appliedAt:
              new Date(),
          }
        : {
            status: "saved",
          };

      const application =
        await Application.findOneAndUpdate(
          {
            user: req.userId,
            job: req.params.jobId,
          },
          update,
          {
            new: true,
          }
        );

      if (!application) {
        return res.status(404).json({
          error:
            "No application found for this job yet",
        });
      }

      // Return the complete application.
      res.json(application);
    } catch (err) {
      res.status(500).json({
        error:
          err.message ||
          "Unable to confirm application",
      });
    }
  }
);

export default router;