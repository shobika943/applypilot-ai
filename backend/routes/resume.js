import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { callClaudeJSON } from "../utils/aiClient.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/resume/upload  (multipart/form-data, field name "resume")
router.post("/upload", requireAuth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let resumeText = "";
    if (req.file.mimetype === "application/pdf") {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text;
    } else {
      resumeText = req.file.buffer.toString("utf-8");
    }

    const skills = await callClaudeJSON({
      system:
        "You extract a clean list of technical and professional skills from a resume's raw text.",
      prompt: `Extract every distinct skill (languages, frameworks, tools, platforms, soft skills)
mentioned in this resume. Return JSON: {"skills": ["skill1", "skill2", ...]}

RESUME TEXT:
${resumeText.slice(0, 12000)}`,
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        resumeText,
        resumeSkills: skills.skills || [],
        resumeFileName: req.file.originalname,
      },
      { new: true }
    );

    res.json({
      message: "Resume uploaded and parsed",
      resumeSkills: user.resumeSkills,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email resumeSkills resumeFileName");
  res.json(user);
});

export default router;
