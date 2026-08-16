import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { api } from "../api/client";

import Avatar, {
  AvatarStyle,
} from "../components/Avatar";

/* =========================================================
   TYPES
   ========================================================= */

interface ProfileUser {
  _id?: string;
  name?: string;
  email?: string;

  avatarStyle?:
    | "male"
    | "female"
    | "neutral";

  resumeFileName?: string;
  resumeSkills?: string[];
}

interface ProfileApplication {
  _id: string;

  job:
    | string
    | {
        _id: string;
        title?: string;
        company?: string;
        location?: string;
      };

  matchScore:
    | number
    | null;

  status:
    | "matched"
    | "saved"
    | "applied"
    | "prepping"
    | "interviewed";

  appliedAt?: string;
  createdAt?: string;
}

interface ProfileGuide {
  _id: string;
  application: string;
  totalQuestions?: number;
  createdAt?: string;
}

interface ProfileMockQuestion {
  question?: string;
  answer?: string;
  category?: string;
  isCoding?: boolean;
}

interface ProfileMockResponse {
  question?: string;
  userAnswer?: string;
  score?: number;
}

interface ProfileMockInterview {
  _id: string;

  application?:
    | string
    | {
        _id?: string;

        job?:
          | string
          | {
              title?: string;
              company?: string;
            };
      };

  guide?:
    | string
    | {
        _id?: string;
      };

  questions?: ProfileMockQuestion[];

  currentQuestionIndex?: number;

  responses?: ProfileMockResponse[];

  status:
    | "in_progress"
    | "completed";

  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;

  weakTopics?: string[];
  strongTopics?: string[];
  nextSteps?: string[];

  createdAt?: string;
  updatedAt?: string;
}

interface ProfileStatistics {
  applications: number;
  interviewKits: number;
  mockSessions: number;
  completedMockSessions?: number;
}

interface ProfileData {
  user: ProfileUser;
  statistics: ProfileStatistics;
  applications: ProfileApplication[];
  interviewGuides: ProfileGuide[];
  mockInterviews: ProfileMockInterview[];
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getJobTitle(
  application: ProfileApplication
) {
  if (typeof application.job === "string") {
    return "Job application";
  }

  return (
    application.job.title ||
    "Job application"
  );
}

function getCompany(
  application: ProfileApplication
) {
  if (typeof application.job === "string") {
    return "Company";
  }

  return (
    application.job.company ||
    "Company"
  );
}

function getLocation(
  application: ProfileApplication
) {
  if (typeof application.job === "string") {
    return "";
  }

  return application.job.location || "";
}

function getStatusLabel(
  status: ProfileApplication["status"]
) {
  switch (status) {
    case "matched":
      return "Matched";

    case "saved":
      return "Saved";

    case "applied":
      return "Applied";

    case "prepping":
      return "Interview Prep";

    case "interviewed":
      return "Interviewed";

    default:
      return status;
  }
}

function getStatusClass(
  status: ProfileApplication["status"]
) {
  switch (status) {
    case "matched":
      return "profile-status profile-status-matched";

    case "applied":
      return "profile-status profile-status-applied";

    case "prepping":
      return "profile-status profile-status-prepping";

    case "interviewed":
      return "profile-status profile-status-interviewed";

    case "saved":
      return "profile-status profile-status-saved";

    default:
      return "profile-status";
  }
}

/* =========================================================
   MOCK INTERVIEW HELPERS
   ========================================================= */

function getMockTotalQuestions(
  mock: ProfileMockInterview
) {
  if (
    Array.isArray(mock.questions) &&
    mock.questions.length > 0
  ) {
    return mock.questions.length;
  }

  return 20;
}

function getMockAnsweredQuestions(
  mock: ProfileMockInterview
) {
  if (Array.isArray(mock.responses)) {
    return mock.responses.length;
  }

  return Math.min(
    mock.currentQuestionIndex || 0,
    getMockTotalQuestions(mock)
  );
}

function getMockProgress(
  mock: ProfileMockInterview
) {
  if (mock.status === "completed") {
    return 100;
  }

  const total =
    getMockTotalQuestions(mock);

  const answered =
    getMockAnsweredQuestions(mock);

  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (answered / total) * 100
    )
  );
}

function getMockTitle(
  mock: ProfileMockInterview
) {
  if (
    mock.application &&
    typeof mock.application !== "string" &&
    mock.application.job &&
    typeof mock.application.job !== "string"
  ) {
    return (
      mock.application.job.title ||
      "Mock Interview"
    );
  }

  return "Mock Interview";
}

function getMockCompany(
  mock: ProfileMockInterview
) {
  if (
    mock.application &&
    typeof mock.application !== "string" &&
    mock.application.job &&
    typeof mock.application.job !== "string"
  ) {
    return (
      mock.application.job.company ||
      "Practice Session"
    );
  }

  return "Practice Session";
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Profile() {
  const navigate = useNavigate();

  const [
    profile,
    setProfile,
  ] = useState<ProfileData | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD PROFILE
     ======================================================= */

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const data =
        await api.getProfile();

      setProfile(data);
    } catch (err: any) {
      console.error(
        "Profile loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  /* =======================================================
     RECENT DATA
     ======================================================= */

  const recentApplications =
    useMemo(
      () =>
        [
          ...(profile?.applications || []),
        ].slice(0, 5),
      [profile]
    );

  const recentMocks =
    useMemo(
      () =>
        [
          ...(profile?.mockInterviews || []),
        ].slice(0, 5),
      [profile]
    );

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-icon">
            👤
          </div>

          <h2>
            Loading your profile...
          </h2>

          <p>
            Gathering your applications,
            interview kits and practice
            sessions.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {
    return (
      <div className="profile-page">
        <div className="card error-card">
          <p className="error">
            {error}
          </p>

          <button
            type="button"
            onClick={loadProfile}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const user = profile.user;

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="profile-page">

      {/* =====================================================
          PROFILE HERO
          ===================================================== */}

      <section className="profile-hero">
        <div className="profile-hero-main">

          <Avatar
            style={
              (user.avatarStyle ||
                "neutral") as AvatarStyle
            }
            size={78}
          />

          <div className="profile-hero-content">

            <span className="eyebrow">
              YOUR PROFILE
            </span>

            <h1>
              Welcome back,{" "}
              {user.name || "there"} 👋
            </h1>

            <p>
              Manage your resume,
              applications, interview kits
              and practice sessions from one
              place.
            </p>

            {user.email && (
              <span className="profile-email">
                {user.email}
              </span>
            )}

          </div>
        </div>

        <div className="profile-hero-actions">

          <button
            type="button"
            onClick={loadProfile}
          >
            Refresh
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() =>
              navigate("/resume")
            }
          >
            Manage Resume
          </button>

        </div>
      </section>

      {/* =====================================================
          QUICK STATS
          ===================================================== */}

      <section className="profile-stats">

        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            📋
          </div>

          <div>
            <strong>
              {
                profile.statistics
                  .applications
              }
            </strong>

            <span>
              Applications
            </span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            🎯
          </div>

          <div>
            <strong>
              {
                profile.statistics
                  .interviewKits
              }
            </strong>

            <span>
              Interview Kits
            </span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            🎤
          </div>

          <div>
            <strong>
              {
                profile.statistics
                  .mockSessions
              }
            </strong>

            <span>
              Mock Sessions
            </span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            🏆
          </div>

          <div>
            <strong>
              {
                profile.statistics
                  .completedMockSessions ||
                0
              }
            </strong>

            <span>
              Completed
            </span>
          </div>
        </div>

      </section>

      {/* =====================================================
          RESUME PROFILE
          ===================================================== */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div>
            <span className="eyebrow">
              RESUME
            </span>

            <h2>
              Your Resume Profile
            </h2>

            <p>
              The skills ApplyPilot uses for
              job matching.
            </p>
          </div>

          <Link
            to="/resume"
            className="profile-section-link"
          >
            Manage Resume →
          </Link>

        </div>

        <div className="profile-resume-card">

          <div className="profile-resume-file">

            <span className="profile-resume-icon">
              📄
            </span>

            <div className="profile-resume-details">
              <strong>
                {user.resumeFileName ||
                  "No resume uploaded"}
              </strong>

              <span>
                {user.resumeFileName
                  ? "Resume available for matching"
                  : "Upload a resume to unlock better matches"}
              </span>
            </div>

          </div>

          {(user.resumeSkills || []).length > 0 && (
            <div className="profile-skills">

              {(
                user.resumeSkills || []
              ).map((skill) => (
                <span
                  key={skill}
                  className="profile-skill-chip"
                >
                  {skill}
                </span>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          APPLICATION ACTIVITY
          ===================================================== */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div>
            <span className="eyebrow">
              APPLICATION ACTIVITY
            </span>

            <h2>
              Recent Applications
            </h2>

            <p>
              Your latest application
              activity.
            </p>
          </div>

          <Link
            to="/applications"
            className="profile-section-link"
          >
            View All →
          </Link>

        </div>

        {recentApplications.length === 0 ? (

          <div className="profile-empty-card">

            <div className="profile-empty-icon">
              🚀
            </div>

            <h3>
              Your application journey
              starts here
            </h3>

            <p>
              Search for a job and your
              applications will appear here.
            </p>

            <Link
              to="/jobs"
              className="profile-primary-link"
            >
              Find Jobs →
            </Link>

          </div>

        ) : (

          <div className="profile-application-list">

            {recentApplications.map(
              (application) => {

                const jobId =
                  typeof application.job ===
                  "string"
                    ? application.job
                    : application.job?._id;

                const company =
                  getCompany(application);

                const title =
                  getJobTitle(application);

                const location =
                  getLocation(application);

                return (
                  <article
                    key={application._id}
                    className="profile-application-card"
                  >

                    <div className="profile-application-main">

                      <div
                        className="profile-company-avatar"
                        title={`Company: ${company}`}
                      >
                        🏢
                      </div>

                      <div className="profile-application-info">

                        <h3>
                          {title}
                        </h3>

                        <div className="profile-company-name">

                          <strong>
                            {company}
                          </strong>

                          {location && (
                            <span>
                              · {location}
                            </span>
                          )}

                        </div>

                        <div className="profile-application-meta">

                          <span
                            className={getStatusClass(
                              application.status
                            )}
                          >
                            {getStatusLabel(
                              application.status
                            )}
                          </span>

                          {application.matchScore != null && (
                            <span className="profile-match">

                              <span>
                                Match
                              </span>

                              <strong>
                                {
                                  application.matchScore
                                }%
                              </strong>

                            </span>
                          )}

                          {application.appliedAt && (
                            <span className="profile-date">

                              <span>
                                Applied
                              </span>

                              <strong>
                                {formatDate(
                                  application.appliedAt
                                )}
                              </strong>

                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    <div className="profile-application-actions">

                      {jobId && (
                        <Link
                          to={`/jobs/${jobId}`}
                          className="profile-small-button"
                        >
                          View Job
                        </Link>
                      )}

                      {(
                        application.status ===
                          "prepping" ||
                        application.status ===
                          "interviewed"
                      ) && (
                        <Link
                          to={`/applications/${application._id}/prep`}
                          className="profile-small-primary"
                        >
                          Interview Kit →
                        </Link>
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =====================================================
          INTERVIEW PREPARATION
          ===================================================== */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div>
            <span className="eyebrow">
              INTERVIEW PREPARATION
            </span>

            <h2>
              Interview Kits
            </h2>

            <p>
              Your personalized preparation
              guides are ready here.
            </p>
          </div>

        </div>

        {profile.interviewGuides.length === 0 ? (

          <div className="profile-empty-card compact">

            <div className="profile-empty-icon">
              🎯
            </div>

            <h3>
              No interview kits yet
            </h3>

            <p>
              Confirm an application and
              ApplyPilot will prepare a
              personalized interview kit.
            </p>

          </div>

        ) : (

          <div className="profile-kit-list">

            {profile.interviewGuides
              .slice(0, 5)
              .map((guide) => (

                <div
                  key={guide._id}
                  className="profile-kit-card"
                >

                  <div className="profile-kit-icon">
                    🎯
                  </div>

                  <div className="profile-kit-info">

                    <h3>
                      Personalized
                      Interview Kit
                    </h3>

                    <p>
                      {guide.totalQuestions || 0}{" "}
                      questions
                    </p>

                    <span>
                      Created{" "}
                      {formatDate(
                        guide.createdAt
                      )}
                    </span>

                  </div>

                  <Link
                    to={`/applications/${guide.application}/prep`}
                    className="profile-small-primary"
                  >
                    Open Kit →
                  </Link>

                </div>

              ))}

          </div>
        )}

      </section>

      {/* =====================================================
          MOCK INTERVIEW PROGRESS
          ===================================================== */}

      <section className="profile-section">

        <div className="profile-section-heading">

          <div>
            <span className="eyebrow">
              PRACTICE HISTORY
            </span>

            <h2>
              Mock Interview Progress
            </h2>

            <p>
              Track every mock interview,
              including sessions still in
              progress.
            </p>
          </div>

        </div>

        {recentMocks.length === 0 ? (

          <div className="profile-empty-card compact">

            <div className="profile-empty-icon">
              🎤
            </div>

            <h3>
              No mock interviews yet
            </h3>

            <p>
              Open an Interview Kit and
              start a mock interview practice
              session.
            </p>

          </div>

        ) : (

          <div className="profile-mock-list">

            {recentMocks.map((mock) => {

              const total =
                getMockTotalQuestions(mock);

              const answered =
                getMockAnsweredQuestions(mock);

              const progress =
                getMockProgress(mock);

              const remaining =
                Math.max(
                  0,
                  total - answered
                );

              return (
                <div
                  key={mock._id}
                  className="profile-mock-card"
                >

                  <div className="profile-mock-icon">
                    🎤
                  </div>

                  <div className="profile-mock-info">

                    <h3>
                      {getMockTitle(mock)}
                    </h3>

                    <p>
                      {getMockCompany(mock)}
                    </p>

                    <span>
                      Started{" "}
                      {formatDate(
                        mock.createdAt
                      )}
                    </span>

                    <div className="profile-mock-progress-wrapper">

                      <div className="profile-mock-progress-track">

                        <div
                          className="profile-mock-progress-fill"
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />

                      </div>

                      <div className="profile-mock-progress-label">

                        <span>
                          {answered} / {total}{" "}
                          questions answered
                        </span>

                        <strong>
                          {progress}%
                        </strong>

                      </div>

                    </div>

                  </div>

                  <div className="profile-mock-score">

                    {mock.status === "completed" ? (
                      <>
                        <strong>
                          {mock.overallScore != null
                            ? `${mock.overallScore}%`
                            : "—"}
                        </strong>

                        <span>
                          Overall
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>
                          {remaining}
                        </strong>

                        <span>
                          Remaining
                        </span>
                      </>
                    )}

                  </div>

                  {mock.status === "completed" ? (

                    <Link
                      to={`/mock-interview/${mock._id}/report`}
                      className="profile-small-primary"
                    >
                      View Report →
                    </Link>

                  ) : (

                    <Link
                      to={
                        mock.guide &&
                        typeof mock.guide === "string"
                          ? `/mock-interview/${mock.guide}`
                          : "#"
                      }
                      className={
                        mock.guide
                          ? "profile-small-primary"
                          : "profile-small-button"
                      }
                      onClick={(event) => {

                        if (
                          !mock.guide ||
                          typeof mock.guide !== "string"
                        ) {
                          event.preventDefault();
                        }

                      }}
                    >
                      Continue Practice →
                    </Link>

                  )}

                </div>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}