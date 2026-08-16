import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { api } from "../api/client";

interface ApplicationItem {
  _id: string;

  job:
    | string
    | {
        _id: string;
        title?: string;
        company?: string;
        location?: string;
        postedAt?: string;
      };

  matchScore:
    | number
    | null;

  matchedSkills: string[];

  skillGaps: string[];

  status:
    | "matched"
    | "saved"
    | "applied"
    | "prepping"
    | "interviewed";

  clickedApplyAt?: string;

  appliedAt?: string;

  createdAt?: string;
}

function getJobTitle(
  application: ApplicationItem
) {
  if (
    typeof application.job ===
    "string"
  ) {
    return "Job application";
  }

  return (
    application.job.title ||
    "Job application"
  );
}

function getCompany(
  application: ApplicationItem
) {
  if (
    typeof application.job ===
    "string"
  ) {
    return "Company";
  }

  return (
    application.job.company ||
    "Company"
  );
}

function getLocation(
  application: ApplicationItem
) {
  if (
    typeof application.job ===
    "string"
  ) {
    return "";
  }

  return (
    application.job.location ||
    ""
  );
}

function formatDate(
  date?: string
) {
  if (!date) {
    return "";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getStatusLabel(
  status: ApplicationItem["status"]
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
  status: ApplicationItem["status"]
) {
  switch (status) {
    case "applied":
      return "application-status application-status-applied";

    case "prepping":
      return "application-status application-status-prepping";

    case "interviewed":
      return "application-status application-status-interviewed";

    case "saved":
      return "application-status application-status-saved";

    case "matched":
      return "application-status application-status-matched";

    default:
      return "application-status";
  }
}

export default function Applications() {
  const [
    applications,
    setApplications,
  ] = useState<
    ApplicationItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const data =
        await api.getMyApplications();

      setApplications(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (
      err: any
    ) {
      console.error(
        "Unable to load applications:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  }

  const total =
    applications.length;

  const applied =
    applications.filter(
      (item) =>
        item.status ===
        "applied"
    ).length;

  const preparing =
    applications.filter(
      (item) =>
        item.status ===
        "prepping"
    ).length;

  const interviewed =
    applications.filter(
      (item) =>
        item.status ===
        "interviewed"
    ).length;

  return (
    <div className="page-shell application-tracker-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-heading application-page-heading">
        <div>
          <span className="eyebrow">
            APPLICATION TRACKER
          </span>

          <h1>
            Your Applications
          </h1>

          <p>
            Keep track of the jobs
            you've saved, applied
            to, and prepared for.
          </p>
        </div>

        <div className="application-header-actions">
          <button
            type="button"
            onClick={
              loadApplications
            }
            disabled={
              loading
            }
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <div className="application-stats">

        <div className="application-stat-card">
          <span className="application-stat-icon">
            📋
          </span>

          <div>
            <strong>
              {total}
            </strong>

            <span>
              Total Applications
            </span>
          </div>
        </div>

        <div className="application-stat-card">
          <span className="application-stat-icon">
            ✅
          </span>

          <div>
            <strong>
              {applied}
            </strong>

            <span>
              Applied
            </span>
          </div>
        </div>

        <div className="application-stat-card">
          <span className="application-stat-icon">
            🎯
          </span>

          <div>
            <strong>
              {preparing}
            </strong>

            <span>
              Preparing
            </span>
          </div>
        </div>

        <div className="application-stat-card">
          <span className="application-stat-icon">
            🎤
          </span>

          <div>
            <strong>
              {interviewed}
            </strong>

            <span>
              Interviewed
            </span>
          </div>
        </div>

      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          className="card error-card"
          style={{
            marginTop:
              "18px",
          }}
        >
          <p className="error">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadApplications
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (
        <div
          className="card application-loading-card"
        >
          <div className="application-loading-icon">
            📋
          </div>

          <h3>
            Loading your applications...
          </h3>

          <p className="status">
            Fetching your latest
            application activity.
          </p>
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
          ===================================================== */}

      {!loading &&
        !error &&
        applications.length ===
          0 && (
          <div
            className="card application-empty-card"
          >
            <div className="application-empty-icon">
              🚀
            </div>

            <h2>
              Your application journey
              starts here
            </h2>

            <p>
              Search for a job, apply
              on the original listing,
              and we'll keep your
              application and interview
              preparation organized here.
            </p>

            <Link
              to="/jobs"
              className="application-find-jobs-button"
            >
              Find Jobs →
            </Link>
          </div>
        )}

      {/* =====================================================
          APPLICATION LIST
          ===================================================== */}

      {!loading &&
        applications.length >
          0 && (
          <section className="application-section">

            <div className="application-section-heading">
              <div>
                <span className="eyebrow">
                  APPLICATION ACTIVITY
                </span>

                <h2>
                  Recent Applications
                </h2>

                <p className="status">
                  Your latest job
                  activity.
                </p>
              </div>

              <span className="application-count">
                {total}{" "}
                {total === 1
                  ? "application"
                  : "applications"}
              </span>
            </div>

            <div className="application-list">

              {applications.map(
                (
                  application
                ) => {
                  const title =
                    getJobTitle(
                      application
                    );

                  const company =
                    getCompany(
                      application
                    );

                  const location =
                    getLocation(
                      application
                    );

                  const jobId =
                    typeof application.job ===
                    "string"
                      ? application.job
                      : application.job?._id;

                  return (
                    <article
                      key={
                        application._id
                      }
                      className="application-card"
                    >

                      {/* =================================================
                          MAIN CONTENT
                          ================================================= */}

                      <div className="application-main">

                        {/* Company icon instead of H/R/B/Z */}

                        <div
                          className="application-company-avatar"
                          title={`Company: ${company}`}
                          aria-label={`Company: ${company}`}
                        >
                          🏢
                        </div>

                        <div className="application-info">

                          <h3>
                            {title}
                          </h3>

                          <div className="application-company-name">
                            <strong>
                              {company}
                            </strong>

                            {location && (
                              <span>
                                ·{" "}
                                {location}
                              </span>
                            )}
                          </div>

                          <div className="application-meta">

                            {/* STATUS */}

                            <span
                              className={getStatusClass(
                                application.status
                              )}
                            >
                              {getStatusLabel(
                                application.status
                              )}
                            </span>

                            {/* MATCH */}

                            {application.matchScore !=
                              null && (
                              <span className="application-match">
                                <span>
                                  Match
                                </span>

                                <strong>
                                  {
                                    application.matchScore
                                  }
                                  %
                                </strong>
                              </span>
                            )}

                            {/* APPLIED DATE */}

                            {application.appliedAt && (
                              <span className="application-date">
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

                      {/* =================================================
                          ACTIONS
                          ================================================= */}

                      <div className="application-actions">

                        {jobId && (
                          <Link
                            to={`/jobs/${jobId}`}
                            className="application-view-button"
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
                            className="application-prep-button"
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
          </section>
        )}

    </div>
  );
}