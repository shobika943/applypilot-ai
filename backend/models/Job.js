import mongoose from "mongoose";

// Jobs are auto-populated from a live job search (Adzuna, which aggregates
// LinkedIn/Naukri/Indeed/company sites) based on the user's resume. Manual
// entry is still supported as a fallback via POST /api/jobs.
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    link: { type: String }, // manual-entry fallback field (direct link the user pasted)

    // IMPORTANT: redirectUrl is the URL the job-search API (Adzuna) gives us.
    // It is Adzuna's own tracked redirect, NOT a guaranteed direct link to
    // the employer/LinkedIn/Naukri posting — Adzuna resolves it on click.
    // sourcePlatform is a best-effort label, "Unconfirmed" when we can't tell.
    redirectUrl: { type: String },
    sourcePlatform: { type: String, default: "Unconfirmed" },

    source: { type: String, default: "manual" }, // "adzuna" | "manual"
    externalId: { type: String }, // source's own job id, used to dedupe on re-search
    postedAt: { type: Date },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    requiredSkills: [{ type: String }],

    // Set once per search batch by the AI relevance-ranking step (only run
    // on a filtered/deduped shortlist, not on every raw result).
    relevanceScore: { type: Number },
    relevanceReason: { type: String },

    status: {
      type: String,
      enum: ["active", "inactive", "unverified"],
      default: "unverified",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Prevents duplicate rows when the same live listing is fetched again on a later search
jobSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Job", jobSchema);
