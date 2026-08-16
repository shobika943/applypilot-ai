import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    matchScore: { type: Number, default: null },
    matchedSkills: [{ type: String }],
    skillGaps: [{ type: String }],
    status: {
      // "saved": user clicked Apply and was redirected out, but hasn't
      // confirmed whether they actually submitted the external application.
      // "applied": user confirmed they submitted it — only then do we
      // unlock interview prep, since prep is tied to a real application.
      type: String,
      enum: ["matched", "saved", "applied", "prepping", "interviewed"],
      default: "matched",
    },
    clickedApplyAt: { type: Date },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
