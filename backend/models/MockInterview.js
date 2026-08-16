import mongoose from "mongoose";

// -------------------------------------------------------------
// QUESTION USED BY THE MOCK INTERVIEW
// -------------------------------------------------------------

const mockQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },

    // Ideal/reference answer used only for evaluation.
    answer: {
      type: String,
      required: true,
    },

    // Helps the final report understand what was tested.
    category: {
      type: String,
      enum: [
        "technical",
        "coding",
        "behavioral",
        "situational",
        "project",
      ],
      default: "technical",
    },

    // true when this is a coding/practical question.
    isCoding: {
      type: Boolean,
      default: false,
    },

    // Original Interview Kit question/topic used as the basis.
    sourceQuestion: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// -------------------------------------------------------------
// CANDIDATE RESPONSE
// -------------------------------------------------------------

const responseSchema = new mongoose.Schema(
  {
    question: String,

    userAnswer: String,

    score: Number,

    correctPoints: [String],

    missingPoints: [String],

    improvedAnswer: String,

    followUp: String,

    category: String,

    isCoding: Boolean,
  },
  { _id: false }
);

// -------------------------------------------------------------
// MOCK INTERVIEW
// -------------------------------------------------------------

const mockInterviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewGuide",
      required: true,
    },

    // IMPORTANT:
    // The mock interview now has its OWN 20 questions.
    questions: {
      type: [mockQuestionSchema],
      default: [],
    },

    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    responses: {
      type: [responseSchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "in_progress",
        "completed",
      ],
      default: "in_progress",
    },

    overallScore: Number,

    technicalScore: Number,

    communicationScore: Number,

    weakTopics: [String],

    strongTopics: [String],

    nextSteps: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "MockInterview",
  mockInterviewSchema
);