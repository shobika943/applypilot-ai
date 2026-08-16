import { Router } from "express";

import User from "../models/User.js";
import Application from "../models/Application.js";
import InterviewGuide from "../models/InterviewGuide.js";
import MockInterview from "../models/MockInterview.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

/* =========================================================
   GET USER PROFILE
   =========================================================

   GET /api/profile

   Returns:
   - user
   - resume information
   - applications
   - interview kits
   - mock interview history
   - statistics
   ========================================================= */

router.get(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      /* =====================================================
         USER
         ===================================================== */

      const user =
        await User.findById(
          req.userId
        ).select(
          "-password"
        );

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      /* =====================================================
         APPLICATIONS
         ===================================================== */

      const applications =
        await Application.find({
          user: req.userId,
        })
          .populate(
            "job",
            "title company location postedAt redirectUrl link sourcePlatform relevanceScore"
          )
          .sort({
            appliedAt: -1,
            createdAt: -1,
          });

      const applicationIds =
        applications.map(
          (
            application
          ) => application._id
        );

      /* =====================================================
         INTERVIEW GUIDES
         ===================================================== */

      const guides =
        applicationIds.length > 0
          ? await InterviewGuide.find({
              application: {
                $in: applicationIds,
              },
            }).sort({
              createdAt: -1,
            })
          : [];

      /* =====================================================
         MOCK INTERVIEWS
         ===================================================== */

      const mockInterviews =
        applicationIds.length > 0
          ? await MockInterview.find({
              application: {
                $in: applicationIds,
              },
            })
              .populate({
                path: "application",
                populate: {
                  path: "job",
                  select:
                    "title company location",
                },
              })
              .sort({
                createdAt: -1,
              })
          : [];

      /* =====================================================
         STATISTICS
         ===================================================== */

      const completedMockSessions =
        mockInterviews.filter(
          (
            mock
          ) =>
            mock.status ===
            "completed"
        );

      const statistics = {
        applications:
          applications.length,

        interviewKits:
          guides.length,

        mockSessions:
          mockInterviews.length,

        completedMockSessions:
          completedMockSessions.length,
      };

      /* =====================================================
         RESPONSE
         ===================================================== */

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,

          avatarStyle:
            user.avatarStyle ||
            "neutral",

          resumeFileName:
            user.resumeFileName ||
            "",

          resumeSkills:
            user.resumeSkills ||
            [],
        },

        statistics,

        applications,

        interviewGuides:
          guides,

        mockInterviews,
      });
    } catch (err) {
      console.error(
        "Profile error:",
        err
      );

      res.status(500).json({
        error:
          err?.message ||
          "Unable to load profile",
      });
    }
  }
);

export default router;