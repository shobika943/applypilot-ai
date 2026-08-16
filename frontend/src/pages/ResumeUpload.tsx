import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.me().then((u) => setSkills(u.resumeSkills || [])).catch(() => {});
  }, []);

  async function upload() {
    if (!file) return;
    setStatus("Uploading and analyzing resume...");
    try {
      const data = await api.uploadResume(file);
      setSkills(data.resumeSkills);
      setStatus("Resume analyzed.");
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  return (
    <div className="card">
      <h2>1. Upload Resume</h2>
      <p>Upload a PDF or plain-text resume. AI extracts your skills automatically.</p>
      <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={upload} disabled={!file}>Upload &amp; Analyze</button>
      {status && <p className="status">{status}</p>}
      {skills.length > 0 && (
        <>
          <h3>Detected Skills</h3>
          <div className="chip-row">
            {skills.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
