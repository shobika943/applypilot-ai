import { Router } from "express";
import InterviewGuide from "../models/InterviewGuide.js";
import MockInterview from "../models/MockInterview.js";
import { requireAuth } from "../middleware/auth.js";
import { callClaudeJSON } from "../utils/aiClient.js";

const router = Router();

// =============================================================
// Generate exactly 20 NEW mock questions
// =============================================================

async function generateMockQuestions(guide) {
  const guideQuestions = (guide.questions || []).map((q) => ({
    question: q.question,
    answer: q.answer,
  }));

  if (guideQuestions.length === 0) {
    throw new Error(
      "Interview guide does not contain any questions."
    );
  }

  const result = await callClaudeJSON({
    system: `
You are an expert technical interviewer.

Create a mock interview from the provided Interview Kit.

The Interview Kit is the source material, but the mock interview
MUST ask NEW questions rather than copying the original wording.

Generate EXACTLY 20 questions.

Distribution:
- 8 technical
- 4 project/experience
- 3 behavioral/situational
- 3 coding/practical
- 2 additional relevant questions

Avoid duplicate or near-duplicate questions.

For coding questions, only ask practical coding questions relevant
to the candidate's technology stack.

Return only valid JSON.
    `,

    prompt: `
INTERVIEW KIT:

${JSON.stringify(guideQuestions, null, 2)}

Return exactly:

{
  "questions": [
    {
      "question": "...",
      "answer": "...",
      "category": "technical",
      "isCoding": false,
      "sourceQuestion": "..."
    }
  ]
}

There must be EXACTLY 20 questions.
    `,

    maxTokens: 6000,
  });

  if (
    !result ||
    !Array.isArray(result.questions)
  ) {
    throw new Error(
      "Gemini did not return a valid mock interview."
    );
  }

  const normalize = (text) =>
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const seen = new Set();

  const questions = result.questions
    .filter(
      (q) =>
        q &&
        typeof q.question === "string" &&
        typeof q.answer === "string"
    )
    .map((q) => ({
      question: q.question.trim(),
      answer: q.answer.trim(),
      category: [
        "technical",
        "coding",
        "behavioral",
        "situational",
        "project",
      ].includes(
        String(q.category).toLowerCase()
      )
        ? String(q.category).toLowerCase()
        : "technical",
      isCoding: Boolean(q.isCoding),
      sourceQuestion:
        typeof q.sourceQuestion === "string"
          ? q.sourceQuestion.trim()
          : "",
    }))
    .filter((q) => {
      const key = normalize(q.question);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

  if (questions.length < 20) {
    throw new Error(
      `Only ${questions.length} unique mock questions were generated.`
    );
  }

  return questions.slice(0, 20);
}

// =============================================================
// START MOCK INTERVIEW
// =============================================================

router.post(
  "/start/:guideId",
  requireAuth,
  async (req, res) => {
    try {
      const guide = await InterviewGuide.findById(
        req.params.guideId
      );

      if (!guide) {
        return res.status(404).json({
          error: "Guide not found",
        });
      }

      const questions =
        await generateMockQuestions(guide);

      const mock = await MockInterview.create({
        application: guide.application,
        guide: guide._id,
        questions,
        currentQuestionIndex: 0,
        responses: [],
        status: "in_progress",
      });

      res.status(201).json({
        mockInterviewId: mock._id,
        question: mock.questions[0],
        questionNumber: 1,
        totalQuestions: mock.questions.length,
      });
    } catch (err) {
      console.error(
        "Mock interview start error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Unable to start mock interview",
      });
    }
  }
);

// =============================================================
// SUBMIT ANSWER
// =============================================================

router.post(
  "/:id/answer",
  requireAuth,
  async (req, res) => {
    try {
      const mock = await MockInterview.findById(
        req.params.id
      );

      if (!mock) {
        return res.status(404).json({
          error: "Mock interview not found",
        });
      }

      if (mock.status === "completed") {
        return res.status(400).json({
          error:
            "This mock interview is already completed",
        });
      }

      const answer =
        typeof req.body.answer === "string"
          ? req.body.answer.trim()
          : "";

      if (!answer) {
        return res.status(400).json({
          error:
            "Please provide an answer before submitting.",
        });
      }

      const currentQuestion =
        mock.questions[mock.currentQuestionIndex];

      if (!currentQuestion) {
        return res.status(400).json({
          error:
            "Current question was not found.",
        });
      }

      // -------------------------------------------------------
      // STRICT QUESTION-SPECIFIC EVALUATION
      // -------------------------------------------------------

      const evaluation =
        await callClaudeJSON({
          system: `
You are a strict but fair interviewer evaluating ONE answer
to ONE specific interview question.

This is a question-specific evaluation.

ABSOLUTE RULES:

1. Evaluate ONLY the current question.
2. Use ONLY the current question and its reference answer.
3. Never use concepts from other questions.
4. Never invent missing points unrelated to this question.
5. "correctPoints" must contain ONLY things the candidate actually
   said correctly in their answer.
6. "missingPoints" must contain ONLY important points required
   for THIS question that the candidate did not provide.
7. If the answer is nonsense, gibberish, empty, or unrelated:
   - score must be 0, 1, or 2
   - correctPoints MUST be []
   - missingPoints must explain what this question actually required.
8. Do not mark an answer correct merely because it contains
   technical words.
9. For behavioral questions, judge the behavioral content.
10. For technical questions, judge the technical content.
11. For coding questions, judge the solution, logic, correctness,
    and explanation.
12. Do not mix behavioral expectations into technical questions.
13. Do not mix technical expectations into behavioral questions.

Scoring:
0-2 = incorrect, nonsense, unrelated, or almost no useful answer
3-5 = partially correct but substantially incomplete
6-8 = good answer covering the main requirements
9 = excellent answer
10 = exceptional interview-quality answer

Return ONLY valid JSON.
          `,

          prompt: `
CURRENT QUESTION:
${currentQuestion.question}

CATEGORY:
${currentQuestion.category}

IS CODING:
${currentQuestion.isCoding ? "YES" : "NO"}

REFERENCE ANSWER:
${currentQuestion.answer}

CANDIDATE ANSWER:
${answer}

Evaluate ONLY the candidate's answer to the CURRENT QUESTION.

Return exactly:

{
  "score": 0,
  "answerQuality": "incorrect",
  "correctPoints": [],
  "missingPoints": [],
  "improvedAnswer": "",
  "followUp": ""
}

answerQuality MUST be one of:
- "excellent"
- "good"
- "partial"
- "incorrect"

For a completely unrelated answer such as:
"fdjdfjshfjl"

return:

{
  "score": 0,
  "answerQuality": "incorrect",
  "correctPoints": [],
  "missingPoints": [
    "The answer does not address the question."
  ],
  "improvedAnswer": "A relevant answer that directly addresses the question.",
  "followUp": "A natural follow-up related to the same topic."
}

IMPORTANT:
Do not mention concepts from another interview question.
          `,

          maxTokens: 2500,
        });

      // -------------------------------------------------------
      // NORMALIZE AI RESULT
      // -------------------------------------------------------

      let score = Number(
        evaluation.score
      );

      if (!Number.isFinite(score)) {
        score = 0;
      }

      score = Math.max(
        0,
        Math.min(
          10,
          Math.round(score)
        )
      );

      const quality = String(
        evaluation.answerQuality || ""
      ).toLowerCase();

      const isIncorrect =
        quality === "incorrect" ||
        score <= 2;

      const correctPoints =
        isIncorrect
          ? []
          : Array.isArray(
              evaluation.correctPoints
            )
          ? evaluation.correctPoints
          : [];

      let missingPoints =
        Array.isArray(
          evaluation.missingPoints
        )
          ? evaluation.missingPoints
          : [];

      /*
        Extra safeguard:
        if the evaluator says the answer is incorrect,
        make sure the UI doesn't accidentally display
        "correct" concepts.
      */
      if (isIncorrect && missingPoints.length === 0) {
        missingPoints = [
          "The answer does not adequately address the question.",
        ];
      }

      const improvedAnswer =
        typeof evaluation.improvedAnswer ===
        "string"
          ? evaluation.improvedAnswer
          : "";

      const followUp =
        typeof evaluation.followUp ===
        "string"
          ? evaluation.followUp
          : "";

      // -------------------------------------------------------
      // SAVE RESPONSE
      // -------------------------------------------------------

      mock.responses.push({
        question:
          currentQuestion.question,

        userAnswer: answer,

        score,

        correctPoints,

        missingPoints,

        improvedAnswer,

        followUp,

        category:
          currentQuestion.category,

        isCoding:
          currentQuestion.isCoding,
      });

      // -------------------------------------------------------
      // NEXT QUESTION
      // -------------------------------------------------------

      mock.currentQuestionIndex += 1;

      const isLast =
        mock.currentQuestionIndex >=
        mock.questions.length;

      if (isLast) {
        mock.status = "completed";
      }

      await mock.save();

      res.json({
        evaluation: {
          score,
          answerQuality: isIncorrect
            ? "incorrect"
            : quality || "good",
          correctPoints,
          missingPoints,
          improvedAnswer,
          followUp,
        },

        isComplete: isLast,

        nextQuestion: isLast
          ? null
          : mock.questions[
              mock.currentQuestionIndex
            ],

        questionNumber:
          mock.currentQuestionIndex + 1,

        totalQuestions:
          mock.questions.length,
      });
    } catch (err) {
      console.error(
        "Mock interview answer error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Unable to evaluate answer",
      });
    }
  }
);

// =============================================================
// FINAL REPORT
// =============================================================

router.get(
  "/:id/report",
  requireAuth,
  async (req, res) => {
    try {
      const mock =
        await MockInterview.findById(
          req.params.id
        );

      if (!mock) {
        return res.status(404).json({
          error:
            "Mock interview not found",
        });
      }

      if (mock.responses.length === 0) {
        return res.status(400).json({
          error:
            "No responses yet",
        });
      }

      if (mock.overallScore == null) {
        const summary =
          await callClaudeJSON({
            system: `
You are an experienced technical interviewer.

Create a final report from the candidate's
actual mock interview responses.

Do not invent strengths or weaknesses.
            `,

            prompt: `
The mock interview contains ${mock.questions.length} questions.

SESSION DATA:
${JSON.stringify(
  mock.responses,
  null,
  2
).slice(0, 18000)}

Return ONLY valid JSON:

{
  "overallScore": 0,
  "technicalScore": 0,
  "communicationScore": 0,
  "weakTopics": [],
  "strongTopics": [],
  "nextSteps": []
}
            `,

            maxTokens: 2500,
          });

        mock.overallScore =
          Number(
            summary.overallScore
          ) || 0;

        mock.technicalScore =
          Number(
            summary.technicalScore
          ) || 0;

        mock.communicationScore =
          Number(
            summary.communicationScore
          ) || 0;

        mock.weakTopics =
          Array.isArray(
            summary.weakTopics
          )
            ? summary.weakTopics
            : [];

        mock.strongTopics =
          Array.isArray(
            summary.strongTopics
          )
            ? summary.strongTopics
            : [];

        mock.nextSteps =
          Array.isArray(
            summary.nextSteps
          )
            ? summary.nextSteps
            : [];

        await mock.save();
      }

      res.json(mock);
    } catch (err) {
      console.error(
        "Mock interview report error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Unable to generate report",
      });
    }
  }
);

export default router;