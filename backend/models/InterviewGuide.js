import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    category: {
      type: String,
      enum: ["Technical", "Project-Based", "Scenario-Based", "HR/Behavioral", "Skill-Gap"],
    },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    whyItMatters: String,
    bucket: {
      type: String,
      enum: ["Must Prepare", "Should Prepare", "Additional Preparation"],
      default: "Must Prepare",
    },
  },
  { _id: true }
);

const interviewGuideSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    totalQuestions: Number,
    breakdown: {
      technical: Number,
      projectBased: Number,
      scenarioBased: Number,
      hrBehavioral: Number,
      skillGap: Number,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("InterviewGuide", interviewGuideSchema);
