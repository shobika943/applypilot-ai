import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../api/client";
import { Evaluation } from "../types";

interface MockQuestion {
  question: string;
  answer?: string;
  category?: string;
  isCoding?: boolean;
}

interface MockStartResponse {
  mockInterviewId: string;
  question: MockQuestion | null;
  questionNumber: number;
  totalQuestions: number;
  answeredQuestions?: number;
  status?: "in_progress" | "completed";
  progress?: number;
  resumed?: boolean;
}

export default function MockInterview() {
  const { guideId } =
    useParams<{ guideId: string }>();

  const navigate =
    useNavigate();

  const [
    mockId,
    setMockId,
  ] = useState("");

  const [
    question,
    setQuestion,
  ] =
    useState<MockQuestion | null>(
      null
    );

  const [
    qNum,
    setQNum,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(10);

  const [
    answeredCount,
    setAnsweredCount,
  ] = useState(0);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    evaluation,
    setEvaluation,
  ] =
    useState<Evaluation | null>(
      null
    );

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    resumed,
    setResumed,
  ] = useState(false);

  /* =========================================================
     START OR RESUME EXISTING MOCK
     ========================================================= */

  useEffect(() => {
    if (!guideId) {
      setError(
        "Interview kit ID is missing."
      );
      setLoading(false);
      return;
    }

    const currentGuideId =
      guideId;

    let cancelled = false;

    async function startOrResume() {
      setLoading(true);
      setError("");
      setEvaluation(null);

      try {
        /*
         * false = resume the latest existing
         * session for this Interview Kit.
         *
         * A new session is created only when
         * the user explicitly chooses
         * "Practice 10 More Questions".
         */
        const data: MockStartResponse =
          await api.startMockInterview(
            currentGuideId,
            false
          );

        if (cancelled) {
          return;
        }

        setMockId(
          data.mockInterviewId
        );

        setTotal(
          data.totalQuestions || 10
        );

        setAnsweredCount(
          data.answeredQuestions || 0
        );

        const answered =
          data.answeredQuestions || 0;

        const calculatedProgress =
          data.totalQuestions > 0
            ? Math.round(
                (answered /
                  data.totalQuestions) *
                  100
              )
            : 0;

        setProgress(
          data.progress ??
            calculatedProgress
        );

        setResumed(
          Boolean(data.resumed)
        );

        /*
         * If the session is already completed,
         * show the report instead of generating
         * another mock interview.
         */
        if (
          data.status ===
            "completed" ||
          !data.question
        ) {
          navigate(
            `/mock-interview/${data.mockInterviewId}/report`,
            {
              replace: true,
            }
          );

          return;
        }

        setQuestion(
          data.question
        );

        setQNum(
          data.questionNumber
        );
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        setError(
          err?.message ||
            "Unable to start mock interview."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    startOrResume();

    return () => {
      cancelled = true;
    };
  }, [guideId, navigate]);

  /* =========================================================
     SUBMIT ANSWER
     ========================================================= */

  async function submit() {
    const trimmedAnswer =
      answer.trim();

    if (!trimmedAnswer) {
      return;
    }

    if (!mockId) {
      return;
    }

    if (!question) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data =
        await api.submitAnswer(
          mockId,
          trimmedAnswer
        );

      /*
       * Show evaluation for the answer
       * that was just submitted.
       */
      setEvaluation(
        data.evaluation
      );

      const newAnsweredCount =
        data.answeredQuestions ??
        answeredCount + 1;

      setAnsweredCount(
        newAnsweredCount
      );

      const newTotal =
        data.totalQuestions ||
        total;

      setTotal(
        newTotal
      );

      const newProgress =
        data.progress ??
        (
          newTotal > 0
            ? Math.round(
                (newAnsweredCount /
                  newTotal) *
                  100
              )
            : 0
        );

      setProgress(
        newProgress
      );

      /*
       * Interview completed.
       */
      if (data.isComplete) {
        setTimeout(() => {
          navigate(
            `/mock-interview/${mockId}/report`
          );
        }, 2200);

        return;
      }

      /*
       * Move to next question after the
       * evaluation has been displayed.
       */
      setQuestion(
        data.nextQuestion
      );

      setQNum(
        data.questionNumber
      );

      setTimeout(() => {
        setEvaluation(null);
        setAnswer("");
      }, 1800);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to evaluate your answer."
      );
    } finally {
      setBusy(false);
    }
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="mock-interview-page">
        <div className="mock-interview-card card">
          <div className="mock-loading-icon">
            🎤
          </div>

          <h2>
            {resumed
              ? "Resuming your interview..."
              : "Preparing your mock interview..."}
          </h2>

          <p className="status">
            {resumed
              ? "Restoring your saved questions and progress."
              : "Creating 10 realistic interview questions for this job role."}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error && !question) {
    return (
      <div className="mock-interview-page">
        <div className="card error-card">
          <h2>
            🎤 Mock Interview
          </h2>

          <p className="error">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  /* =========================================================
     SCORE STATE
     ========================================================= */

  const score =
    evaluation?.score ?? null;

  const isIncorrect =
    score !== null &&
    score <= 2;

  const isPartial =
    score !== null &&
    score >= 3 &&
    score <= 5;

  const isGood =
    score !== null &&
    score >= 6;

  return (
    <div className="mock-interview-page">
      <div className="mock-interview-card card">

        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="mock-interview-header">
          <div>
            <span className="eyebrow">
              MOCK INTERVIEW
            </span>

            <h2>
              🎤 Interview Practice
            </h2>

            <p className="subtitle">
              Realistic practice for
              your selected job role.
            </p>
          </div>

          <div className="mock-question-counter">
            <strong>
              {qNum}
            </strong>

            <span>
              / {total}
            </span>
          </div>
        </div>

        {/* ===================================================
            PROGRESS
            =================================================== */}

        <div className="mock-progress-section">
          <div className="mock-progress-header">
            <span>
              {answeredCount} of{" "}
              {total} answered
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div className="mock-progress-track">
            <div
              className="mock-progress-fill"
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* ===================================================
            QUESTION
            =================================================== */}

        <div className="mock-question-card">
          <span className="mock-question-label">
            Question {qNum}
          </span>

          <h3>
            {question.question}
          </h3>
        </div>

        {/* ===================================================
            ANSWER
            =================================================== */}

        {!evaluation && (
          <div className="mock-answer-section">
            <label
              htmlFor="mock-answer"
              className="mock-answer-label"
            >
              Your Answer
            </label>

            <textarea
              id="mock-answer"
              name="mock-answer"
              rows={7}
              placeholder="Type your answer as if you were speaking to the interviewer..."
              value={answer}
              onChange={(e) =>
                setAnswer(
                  e.target.value
                )
              }
              disabled={busy}
            />

            <div className="mock-answer-actions">
              <span className="mock-answer-tip">
                💡 Be clear and answer
                the question directly.
              </span>

              <button
                type="button"
                onClick={submit}
                disabled={
                  busy ||
                  !answer.trim()
                }
              >
                {busy
                  ? "Evaluating..."
                  : qNum === total
                    ? "Finish Interview"
                    : "Submit Answer"}
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ERROR
            =================================================== */}

        {error && (
          <div
            className="error-card"
            style={{
              marginTop:
                "14px",
            }}
          >
            <p className="error">
              {error}
            </p>
          </div>
        )}

        {/* ===================================================
            EVALUATION
            =================================================== */}

        {evaluation && (
          <div className="eval-panel mock-evaluation-panel">

            <div className="mock-evaluation-score">
              <div>
                <span className="eyebrow">
                  ANSWER EVALUATION
                </span>

                <h3>
                  Score{" "}
                  {evaluation.score}
                  /10
                </h3>
              </div>

              <div className="mock-score-circle">
                {evaluation.score}
              </div>
            </div>

            {/* QUALITY */}

            {isIncorrect && (
              <div className="mock-feedback-banner mock-feedback-danger">
                ❌ Incorrect / Not
                sufficient
              </div>
            )}

            {isPartial && (
              <div className="mock-feedback-banner mock-feedback-warning">
                ⚠️ Partially correct
              </div>
            )}

            {isGood && (
              <div className="mock-feedback-banner mock-feedback-success">
                ✅ Good answer
              </div>
            )}

            {/* FEEDBACK */}

            <div className="two-col mock-feedback-columns">

              <div className="mock-feedback-box">
                <h4>
                  ✅ What you did well
                </h4>

                {evaluation
                  .correctPoints
                  ?.length ? (
                  <ul>
                    {evaluation.correctPoints.map(
                      (
                        point,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          {point}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    {isIncorrect
                      ? "No correct points identified."
                      : "No specific strengths identified."}
                  </p>
                )}
              </div>

              <div className="mock-feedback-box">
                <h4>
                  ⚠️ What to improve
                </h4>

                {evaluation
                  .missingPoints
                  ?.length ? (
                  <ul>
                    {evaluation.missingPoints.map(
                      (
                        point,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                        >
                          {point}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No major missing
                    points identified.
                  </p>
                )}
              </div>

            </div>

            {/* BETTER ANSWER */}

            <div className="mock-improved-answer">
              <h4>
                💡 Better Answer
              </h4>

              <p>
                {
                  evaluation.improvedAnswer
                }
              </p>
            </div>

            {/* FOLLOW UP */}

            {evaluation.followUp && (
              <div className="mock-follow-up">
                <strong>
                  Follow-up:
                </strong>{" "}
                {
                  evaluation.followUp
                }
              </div>
            )}

            {/* NEXT STEP */}

            <div className="mock-next-step">
              {qNum < total ? (
                <span>
                  ✓ Answer saved.
                  Preparing the next
                  question...
                </span>
              ) : (
                <span>
                  🎉 Interview complete!
                  Preparing your final
                  report...
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}