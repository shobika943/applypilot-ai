import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Job, Application } from "../types";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [busy, setBusy] = useState("");
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getJob(id).then(setJob);
    api.getApplication(id).then(setApplication).catch(() => {});
  }, [id]);

  async function verify() {
    if (!id) return;
    setBusy("Verifying job is active...");
    const j = await api.verifyJob(id);
    setJob(j);
    setBusy("");
  }

  async function computeMatch() {
    if (!id) return;
    setBusy("Comparing your resume against this job description...");
    const app = await api.matchJob(id);
    setApplication(app);
    setBusy("");
  }

  // Opens the listing (NOTE: this is the job-search API's redirect, which
  // resolves to the original posting but isn't guaranteed to be a direct
  // LinkedIn/Naukri/employer URL) and records that the user clicked apply.
  async function goApply() {
    if (!id || !job) return;
    const url = job.redirectUrl || job.link;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    const app = await api.clickApply(id);
    setApplication(app);
    setAwaitingConfirm(true);
  }

  async function confirm(applied: boolean) {
    if (!id) return;
    const app = await api.confirmApplied(id, applied);
    setApplication(app);
    setAwaitingConfirm(false);
  }

  function prepareForInterview() {
    if (!application) return;
    navigate(`/applications/${application._id}/prep`);
  }

  if (!job) return <p>Loading...</p>;

  const hasApplyLink = !!(job.redirectUrl || job.link);
  const isApplied = application?.status === "applied" || application?.status === "prepping" || application?.status === "interviewed";
  const isSaved = application?.status === "saved";

  return (
    <div className="card">
      <h2>{job.title}</h2>
      <p className="subtitle">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
      <div className="chip-row">
        <span className={`badge badge-${job.status}`}>{job.status}</span>
        <span className="badge">{job.sourcePlatform || "Unconfirmed source"}</span>
        {job.relevanceScore != null && <span className="badge">Relevance {job.relevanceScore}%</span>}
      </div>
      <p className="jd-text">{job.description}</p>

      <div className="actions">
        {job.source === "manual" && <button onClick={verify}>Verify Job</button>}
        <button onClick={computeMatch}>Compute Match Score</button>
        {hasApplyLink && !isApplied && !isSaved && (
          <button onClick={goApply}>Apply on original listing →</button>
        )}
        {isApplied && <button onClick={prepareForInterview}>Prepare for Interview →</button>}
      </div>

      {busy && <p className="status">{busy}</p>}

      {(isSaved || awaitingConfirm) && (
        <div className="confirm-bar">
          <span>Did you complete the application on the external site?</span>
          <button onClick={() => confirm(true)}>✅ Yes, I applied</button>
          <button className="secondary" onClick={() => confirm(false)}>Not yet</button>
        </div>
      )}

      {isApplied && (
        <p className="status">
          ✅ Applied {application?.appliedAt ? `on ${new Date(application.appliedAt).toLocaleDateString()}` : ""}
        </p>
      )}

      {application && application.matchScore != null && (
        <div className="match-panel">
          <h3>Match Score: {application.matchScore}%</h3>
          <div className="two-col">
            <div>
              <h4>✅ Matched Skills</h4>
              <div className="chip-row">
                {application.matchedSkills.map((s) => <span key={s} className="chip chip-good">{s}</span>)}
              </div>
            </div>
            <div>
              <h4>⚠ Skill Gaps</h4>
              <div className="chip-row">
                {application.skillGaps.map((s) => <span key={s} className="chip chip-warn">{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
