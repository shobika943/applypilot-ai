import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../api/client";

interface ReportQuestion {
  questionIndex: number;

  question: string;

  userAnswer: string;

  correctAnswer: string;

  score: number;

  correctPoints: string[];

  missingPoints: string[];

  improvedAnswer: string;

  category?: string;
}

interface ReportData {
  _id: string;

  guide?: string;

  application?: string;

  overallScore?: number;

  technicalScore?: number;

  communicationScore?: number;

  weakTopics?: string[];

  strongTopics?: string[];

  nextSteps?: string[];

  reportQuestions?: ReportQuestion[];

  responses?: ReportQuestion[];
}

export default function Report() {
  const {
    mockId,
  } = useParams<{
    mockId: string;
  }>();

  const navigate =
    useNavigate();

  const [
    report,
    setReport,
  ] = useState<ReportData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  /* =========================================================
     LOAD REPORT
     ========================================================= */

  useEffect(() => {
    if (!mockId) {
      setError(
        "Mock interview ID is missing."
      );
      setLoading(false);
      return;
    }

    const currentMockId =
      mockId;

    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const data =
          await api.getReport(
            currentMockId
          );

        if (cancelled) {
          return;
        }

        setReport(
          data
        );
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        console.error(
          "Unable to load interview report:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your interview report."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [mockId]);

  /* =========================================================
     PRACTICE MORE
     ========================================================= */

  async function practiceMore() {
    const guideId =
      report?.guide;

    if (!guideId) {
      setError(
        "Interview kit information is unavailable."
      );

      return;
    }

    const currentGuideId =
      guideId;

    setLoadingMore(true);
    setError("");

    try {
      /*
       * true = intentionally create
       * another fresh 10-question session.
       */
      const data =
        await api.startMockInterview(
          currentGuideId,
          true
        );

      navigate(
        `/mock-interview/${currentGuideId}`,
        {
          state: {
            mockInterviewId:
              data.mockInterviewId,
          },
        }
      );
    } catch (err: any) {
      console.error(
        "Unable to start another practice session:",
        err
      );

      setError(
        err?.message ||
          "Unable to prepare another practice session."
      );
    } finally {
      setLoadingMore(false);
    }
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="report-page">
        <div className="card report-loading">

          <div className="report-loading-icon">
            📊
          </div>

          <h2>
            Preparing your final
            interview report...
          </h2>

          <p className="status">
            Reviewing all 10 answers
            and generating your results.
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error && !report) {
    return (
      <div className="report-page">
        <div className="card error-card">

          <h2>
            📊 Interview Report
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

  if (!report) {
    return null;
  }

  /*
   * The new backend returns reportQuestions.
   * responses is kept as a fallback for
   * older sessions.
   */
  const questions =
    report.reportQuestions ||
    report.responses ||
    [];

  return (
    <div className="report-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="report-header">
        <div>
          <span className="eyebrow">
            MOCK INTERVIEW
          </span>

          <h1>
            Final Interview Report
          </h1>

          <p>
            Your performance across the
            10-question interview.
          </p>
        </div>
      </section>

      {/* =====================================================
          SCORES
          ===================================================== */}

      <div className="score-grid report-score-grid">

        <div className="score-box">
          <span>
            {report.overallScore ??
              0}
          </span>

          <label>
            Overall
          </label>
        </div>

        <div className="score-box">
          <span>
            {report.technicalScore ??
              0}
          </span>

          <label>
            Technical
          </label>
        </div>

        <div className="score-box">
          <span>
            {report.communicationScore ??
              0}
          </span>

          <label>
            Communication
          </label>
        </div>

      </div>

      {/* =====================================================
          STRONG / WEAK TOPICS
          ===================================================== */}

      <div className="two-col report-topic-grid">

        <div className="card report-topic-card">
          <h3>
            💪 Strong Topics
          </h3>

          <div className="chip-row">
            {report.strongTopics?.length ? (
              report.strongTopics.map(
                (
                  topic,
                  index
                ) => (
                  <span
                    key={
                      `${topic}-${index}`
                    }
                    className="chip chip-good"
                  >
                    {topic}
                  </span>
                )
              )
            ) : (
              <p className="status">
                No strong topics were
                identified.
              </p>
            )}
          </div>
        </div>

        <div className="card report-topic-card">
          <h3>
            📚 Topics to Improve
          </h3>

          <div className="chip-row">
            {report.weakTopics?.length ? (
              report.weakTopics.map(
                (
                  topic,
                  index
                ) => (
                  <span
                    key={
                      `${topic}-${index}`
                    }
                    className="chip chip-warn"
                  >
                    {topic}
                  </span>
                )
              )
            ) : (
              <p className="status">
                No major weak topics
                identified.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* =====================================================
          NEXT STEPS
          ===================================================== */}

      <div className="card report-next-steps">

        <h3>
          📌 What to Prepare Next
        </h3>

        {report.nextSteps?.length ? (
          <ol>
            {report.nextSteps.map(
              (
                step,
                index
              ) => (
                <li
                  key={
                    index
                  }
                >
                  {step}
                </li>
              )
            )}
          </ol>
        ) : (
          <p className="status">
            Keep practicing the areas
            where your answers were
            less confident.
          </p>
        )}

      </div>

      {/* =====================================================
          QUESTION-BY-QUESTION REVIEW
          ===================================================== */}

      <section className="report-question-section">

        <div className="report-section-heading">

          <div>
            <span className="eyebrow">
              DETAILED REVIEW
            </span>

            <h2>
              Your Interview Answers
            </h2>

            <p>
              Review every question,
              your answer and the
              expected answer.
            </p>
          </div>

          <span className="report-question-count">
            {questions.length}{" "}
            questions
          </span>

        </div>

        <div className="report-question-list">

          {questions.map(
            (
              item,
              index
            ) => {
              const score =
                Number(
                  item.score || 0
                );

              const percentage =
                Math.round(
                  (score / 10) *
                    100
                );

              return (
                <article
                  key={
                    `${item.questionIndex ?? index}-${index}`
                  }
                  className="report-question-card"
                >

                  {/* QUESTION HEADER */}

                  <div className="report-question-header">

                    <div>
                      <span className="report-question-number">
                        Question{" "}
                        {index + 1}
                      </span>

                      <h3>
                        {item.question}
                      </h3>
                    </div>

                    <div
                      className={`report-question-score ${
                        score >= 8
                          ? "report-score-good"
                          : score >= 5
                            ? "report-score-medium"
                            : "report-score-low"
                      }`}
                    >
                      <strong>
                        {score}/10
                      </strong>

                      <span>
                        {percentage}%
                      </span>
                    </div>

                  </div>

                  {/* YOUR ANSWER */}

                  <div className="report-answer-block report-user-answer">

                    <h4>
                      🗣️ Your Answer
                    </h4>

                    <p>
                      {item.userAnswer ||
                        "No answer recorded."}
                    </p>

                  </div>

                  {/* CORRECT ANSWER */}

                  <div className="report-answer-block report-correct-answer">

                    <h4>
                      ✅ Correct / Expected Answer
                    </h4>

                    <p>
                      {item.correctAnswer ||
                        item.improvedAnswer ||
                        "No reference answer available."}
                    </p>

                  </div>

                  {/* FEEDBACK */}

                  <div className="two-col report-feedback-grid">

                    <div className="report-feedback-box">

                      <h4>
                        ✅ What you did well
                      </h4>

                      {item.correctPoints?.length ? (
                        <ul>
                          {item.correctPoints.map(
                            (
                              point,
                              pointIndex
                            ) => (
                              <li
                                key={
                                  pointIndex
                                }
                              >
                                {point}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p>
                          No specific
                          strengths identified.
                        </p>
                      )}

                    </div>

                    <div className="report-feedback-box">

                      <h4>
                        ⚠️ What to improve
                      </h4>

                      {item.missingPoints?.length ? (
                        <ul>
                          {item.missingPoints.map(
                            (
                              point,
                              pointIndex
                            ) => (
                              <li
                                key={
                                  pointIndex
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

                  {/* IMPROVED ANSWER */}

                  {item.improvedAnswer && (
                    <div className="report-improved-answer">

                      <h4>
                        💡 Interview-Ready Answer
                      </h4>

                      <p>
                        {
                          item.improvedAnswer
                        }
                      </p>

                    </div>
                  )}

                </article>
              );
            }
          )}

        </div>

      </section>

      {/* =====================================================
          PRACTICE MORE
          ===================================================== */}

      <section className="report-more-practice">

        <div className="report-more-practice-icon">
          🎤
        </div>

        <div className="report-more-practice-content">

          <span className="eyebrow">
            READY FOR ANOTHER ROUND?
          </span>

          <h2>
            Practice 10 More Questions
          </h2>

          <p>
            Start a fresh set of 10
            interviewer-style questions
            for the same job role.
          </p>

        </div>

        <button
          type="button"
          onClick={
            practiceMore
          }
          disabled={
            loadingMore
          }
          className="report-more-practice-button"
        >
          {loadingMore
            ? "Preparing..."
            : "Practice 10 More Questions →"}
        </button>

      </section>

      {/* =====================================================
          FOOTER ACTIONS
          ===================================================== */}

      <div className="report-footer-actions">

        <button
          type="button"
          className="secondary"
          onClick={() =>
            navigate(
              "/applications"
            )
          }
        >
          ← Applications
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/jobs"
            )
          }
        >
          Find More Jobs
        </button>

      </div>

      {error && (
        <div className="card error-card report-bottom-error">
          <p className="error">
            {error}
          </p>
        </div>
      )}

    </div>
  );
}