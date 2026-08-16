import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { InterviewGuide } from "../types";

export default function InterviewPrep() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [busy, setBusy] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("All");
  const [error, setError] = useState("");

  // Load an already-generated interview guide
  useEffect(() => {
    if (!applicationId) return;

    setError("");

    api.getGuide(applicationId)
      .then((data) => {
        setGuide(data);
      })
      .catch(() => {
        // No guide yet is okay.
        setGuide(null);
      });
  }, [applicationId]);

  // Generate the interview guide
  async function generate() {
    if (!applicationId) {
      setError("Application ID is missing.");
      return;
    }

    try {
      setError("");
      setBusy(
        "Generating 50-100 personalized interview questions... this can take a bit."
      );

      const generatedGuide = await api.generateGuide(applicationId, 60);

      setGuide(generatedGuide);
    } catch (err: any) {
      setError(
        err?.message || "Failed to generate the interview preparation guide."
      );
    } finally {
      setBusy("");
    }
  }

  const buckets = [
    "All",
    "Must Prepare",
    "Should Prepare",
    "Additional Preparation",
  ];

  const questions = guide
    ? bucketFilter === "All"
      ? guide.questions || []
      : (guide.questions || []).filter(
          (q) => q.bucket === bucketFilter
        )
    : [];

  // Start mock interview safely
  function startMockInterview() {
    if (!guide?._id) {
      setError("Interview guide ID is missing. Please generate the guide again.");
      return;
    }

    navigate(`/mock-interview/${guide._id}`);
  }

  return (
    <div>
      <h2>3. Interview Preparation Guide</h2>

      {/* Error message */}
      {error && (
        <div
          className="card"
          style={{
            border: "1px solid #ef4444",
            background: "#fff1f2",
            color: "#b91c1c",
            marginBottom: "16px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* No guide yet */}
      {!guide && (
        <div className="card">
          <h3>Interview Preparation</h3>

          <p>
            No interview guide has been generated yet for this application.
          </p>

          <button onClick={generate} disabled={!!busy}>
            {busy ? "Generating..." : "Generate Interview Prep Guide"}
          </button>

          {busy && (
            <p className="status" style={{ marginTop: "12px" }}>
              {busy}
            </p>
          )}
        </div>
      )}

      {/* Guide generated */}
      {guide && (
        <>
          <div className="card">
            <h3>
              Total Questions: {guide.totalQuestions ?? questions.length}
            </h3>

            <div className="chip-row">
              <span className="chip">
                Technical {guide.breakdown?.technical ?? 0}
              </span>

              <span className="chip">
                Project-Based {guide.breakdown?.projectBased ?? 0}
              </span>

              <span className="chip">
                Scenario-Based {guide.breakdown?.scenarioBased ?? 0}
              </span>

              <span className="chip">
                HR/Behavioral {guide.breakdown?.hrBehavioral ?? 0}
              </span>

              <span className="chip">
                Skill-Gap {guide.breakdown?.skillGap ?? 0}
              </span>
            </div>

            <div className="actions">
              <button onClick={startMockInterview}>
                🎤 Start Mock Interview
              </button>
            </div>
          </div>

          {/* Question filters */}
          <div className="filter-row">
            {buckets.map((bucket) => (
              <button
                key={bucket}
                className={
                  bucketFilter === bucket
                    ? "chip chip-active"
                    : "chip"
                }
                onClick={() => setBucketFilter(bucket)}
              >
                {bucket}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="question-list">
            {questions.length === 0 ? (
              <div className="card">
                <p>No questions available for this category.</p>
              </div>
            ) : (
              questions.map((q, i) => (
                <div
                  className="card question-card"
                  key={q._id || i}
                >
                  <div className="q-header">
                    <span className="badge">
                      {q.category}
                    </span>

                    <span className="badge">
                      {q.difficulty}
                    </span>

                    <span
                      className={`badge priority-${
                        q.priority?.toLowerCase() || ""
                      }`}
                    >
                      {q.priority || "Normal"} priority
                    </span>
                  </div>

                  <h4>
                    Q{i + 1}. {q.question}
                  </h4>

                  <p>
                    <strong>Answer:</strong>{" "}
                    {q.answer}
                  </p>

                  <p className="why">
                    <strong>Why this matters:</strong>{" "}
                    {q.whyItMatters}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}