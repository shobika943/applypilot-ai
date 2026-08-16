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

import {
  Job,
  DatePosted,
} from "../types";

// =============================================================
// TYPES
// =============================================================

type SearchMode =
  | "normal"
  | "resume"
  | "manual";

type ExperienceOption = {
  label: string;
  value: string;
};

type RoleOption = {
  label: string;
  value: string;
};

type PreparingStage =
  | "saving"
  | "generating"
  | "ready";

// =============================================================
// FILTER OPTIONS
// =============================================================

const DATE_FILTERS: {
  label: string;
  value: DatePosted;
}[] = [
  {
    label: "Any time",
    value: "any",
  },
  {
    label: "24 hours",
    value: "24h",
  },
  {
    label: "3 days",
    value: "3d",
  },
  {
    label: "7 days",
    value: "1w",
  },
  {
    label: "30 days",
    value: "1m",
  },
];

const ROLE_OPTIONS: RoleOption[] = [
  {
    label: "Any role",
    value: "",
  },
  {
    label: "Full Stack Developer",
    value: "Full Stack Developer",
  },
  {
    label: "React Developer",
    value: "React Developer",
  },
  {
    label: "Node.js Developer",
    value: "Node.js Developer",
  },
  {
    label: "MERN Developer",
    value: "MERN Developer",
  },
  {
    label: "Software Developer",
    value: "Software Developer",
  },
  {
    label: "Frontend Developer",
    value: "Frontend Developer",
  },
  {
    label: "Backend Developer",
    value: "Backend Developer",
  },
  {
    label: "Python Developer",
    value: "Python Developer",
  },
  {
    label: "ASP.NET Developer",
    value: "ASP.NET Developer",
  },
];

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    label: "Any experience",
    value: "any",
  },
  {
    label: "Fresher / 0–1 year",
    value: "fresher",
  },
  {
    label: "1–2 years",
    value: "1-2",
  },
  {
    label: "2–3 years",
    value: "2-3",
  },
  {
    label: "3–5 years",
    value: "3-5",
  },
];

const DEFAULT_LOCATIONS = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Remote",
  "Bengaluru",
  "Hyderabad",
  "Mumbai",
  "Delhi",
  "Pune",
  "Kochi",
  "Trivandrum",
  "Noida",
  "Gurugram",
  "Kolkata",
];

const WORK_TYPES = [
  "Remote",
  "Hybrid",
  "On-site",
];

// =============================================================
// HELPERS
// =============================================================

function timeAgo(
  dateStr?: string
) {
  if (!dateStr) {
    return "";
  }

  const date =
    new Date(dateStr);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const diffMs =
    Date.now() -
    date.getTime();

  if (diffMs < 0) {
    return "just now";
  }

  const hours =
    Math.floor(
      diffMs / 3600000
    );

  if (hours < 1) {
    return "just now";
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  return `${days}d ago`;
}

function getWorkTypeLabel(
  job: Job
) {
  const text =
    `${job.title || ""} ${
      job.description || ""
    } ${job.location || ""}`.toLowerCase();

  if (
    text.includes("remote") ||
    text.includes("work from home") ||
    text.includes("wfh")
  ) {
    return "Remote";
  }

  if (
    text.includes("hybrid")
  ) {
    return "Hybrid";
  }

  if (
    text.includes("on-site") ||
    text.includes("on site") ||
    text.includes("office based")
  ) {
    return "On-site";
  }

  return "";
}

// =============================================================
// COMPONENT
// =============================================================

export default function Jobs() {
  const navigate =
    useNavigate();

  // -----------------------------------------------------------
  // JOB DATA
  // -----------------------------------------------------------

  const [jobs, setJobs] =
    useState<Job[]>([]);

  // -----------------------------------------------------------
  // SEARCH MODE
  // -----------------------------------------------------------

  const [mode, setMode] =
    useState<SearchMode>(
      "normal"
    );

  // -----------------------------------------------------------
  // NORMAL SEARCH ONLY
  // -----------------------------------------------------------

  const [query, setQuery] =
    useState("");

  const [role, setRole] =
    useState("");

  // -----------------------------------------------------------
  // COMMON FILTERS
  // -----------------------------------------------------------

  const [
    experience,
    setExperience,
  ] = useState("any");

  const [
    selectedWorkTypes,
    setSelectedWorkTypes,
  ] = useState<string[]>([]);

  const [
    selectedLocations,
    setSelectedLocations,
  ] = useState<string[]>([]);

  const [
    locationSearch,
    setLocationSearch,
  ] = useState("");

  const [
    customLocations,
    setCustomLocations,
  ] = useState<string[]>([]);

  const [
    showLocationPicker,
    setShowLocationPicker,
  ] = useState(false);

  const [
    datePosted,
    setDatePosted,
  ] = useState<DatePosted>(
    "1w"
  );

  // -----------------------------------------------------------
  // RESUME MATCH
  // -----------------------------------------------------------

  const [
    resumeFile,
    setResumeFile,
  ] = useState<File | null>(null);

  const [
    resumeSkills,
    setResumeSkills,
  ] = useState<string[]>([]);

  const [
    resumeStatus,
    setResumeStatus,
  ] = useState("");

  const [
    resumeAnalyzed,
    setResumeAnalyzed,
  ] = useState(false);

  const [
    resumeUploading,
    setResumeUploading,
  ] = useState(false);

  // -----------------------------------------------------------
  // UI STATE
  // -----------------------------------------------------------

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    hasSearched,
    setHasSearched,
  ] = useState(false);

  const [
    showManualForm,
    setShowManualForm,
  ] = useState(false);

  const [
    generatingKit,
    setGeneratingKit,
  ] = useState(false);

  const [
    confirmingJobId,
    setConfirmingJobId,
  ] = useState<string | null>(
    null
  );

  // -----------------------------------------------------------
  // PREPARING INTERVIEW KIT MODAL
  // -----------------------------------------------------------

  const [
    showPreparingModal,
    setShowPreparingModal,
  ] = useState(false);

  const [
    preparingStage,
    setPreparingStage,
  ] = useState<PreparingStage>(
    "saving"
  );

  // -----------------------------------------------------------
  // MANUAL JOB FORM
  // -----------------------------------------------------------

  const [form, setForm] =
    useState({
      title: "",
      company: "",
      description: "",
      link: "",
    });

  // -----------------------------------------------------------
  // LOCATION LIST
  // -----------------------------------------------------------

  const allLocations =
    useMemo(
      () =>
        [
          ...DEFAULT_LOCATIONS,
          ...customLocations,
        ].filter(
          (
            value,
            index,
            array
          ) =>
            array.findIndex(
              (item) =>
                item.toLowerCase() ===
                value.toLowerCase()
            ) === index
        ),
      [customLocations]
    );

  const filteredLocations =
    useMemo(
      () =>
        allLocations.filter(
          (item) =>
            item
              .toLowerCase()
              .includes(
                locationSearch.toLowerCase()
              )
        ),
      [
        allLocations,
        locationSearch,
      ]
    );

  // -----------------------------------------------------------
  // LOAD EXISTING RESUME
  // -----------------------------------------------------------

  useEffect(() => {
    async function loadResume() {
      try {
        const user =
          await api.me();

        const existingSkills =
          Array.isArray(
            user.resumeSkills
          )
            ? user.resumeSkills
            : [];

        setResumeSkills(
          existingSkills
        );

        if (
          existingSkills.length > 0
        ) {
          setResumeAnalyzed(
            true
          );

          setResumeStatus(
            "Your resume has already been analyzed."
          );
        }
      } catch {
        // Resume is optional.
      }
    }

    loadResume();
  }, []);

  // -----------------------------------------------------------
  // RESUME UPLOAD
  // -----------------------------------------------------------

  async function uploadAndAnalyzeResume() {
    if (!resumeFile) {
      setResumeStatus(
        "Please choose a PDF or text resume first."
      );
      return;
    }

    const fileName =
      resumeFile.name.toLowerCase();

    const valid =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".txt");

    if (!valid) {
      setResumeStatus(
        "Please upload a PDF or plain-text (.txt) resume."
      );
      return;
    }

    setResumeUploading(
      true
    );

    setError("");

    setResumeStatus(
      "Uploading and analyzing your resume..."
    );

    try {
      const data =
        await api.uploadResume(
          resumeFile
        );

      const detectedSkills =
        Array.isArray(
          data.resumeSkills
        )
          ? data.resumeSkills
          : [];

      setResumeSkills(
        detectedSkills
      );

      setResumeAnalyzed(
        true
      );

      setResumeStatus(
        "Resume analyzed successfully."
      );
    } catch (
      err: any
    ) {
      setResumeAnalyzed(
        false
      );

      setResumeStatus(
        err?.message ||
          "Unable to analyze your resume."
      );
    } finally {
      setResumeUploading(
        false
      );
    }
  }

  // -----------------------------------------------------------
  // SEARCH
  // -----------------------------------------------------------

  async function runSearch(
    searchMode: SearchMode = mode
  ) {
    if (
      searchMode === "resume" &&
      !resumeAnalyzed
    ) {
      setError(
        "Please upload and analyze your resume before using Resume Match."
      );

      setHasSearched(
        false
      );

      return;
    }

    setLoading(
      true
    );

    setError(
      ""
    );

    try {
      const data =
        await api.searchJobs({
          mode:
            searchMode,

          query:
            searchMode === "normal"
              ? query.trim()
              : "",

          role:
            searchMode === "normal"
              ? role.trim()
              : "",

          experience,

          workType:
            selectedWorkTypes,

          locations:
            selectedLocations,

          datePosted,

          page: 1,
        });

      const resultJobs =
        [
          ...(data.jobs || []),
        ].sort(
          (a, b) =>
            (b.relevanceScore || 0) -
            (a.relevanceScore || 0)
        );

      setJobs(
        resultJobs
      );

      setHasSearched(
        true
      );
    } catch (
      err: any
    ) {
      setError(
        err?.message ||
          "Unable to search jobs right now."
      );

      setJobs([]);

      setHasSearched(
        true
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // -----------------------------------------------------------
  // CHANGE MODE
  // -----------------------------------------------------------

  async function changeMode(
    newMode: SearchMode
  ) {
    setMode(
      newMode
    );

    setError(
      ""
    );

    setJobs([]);

    setHasSearched(
      false
    );

    setShowManualForm(
      false
    );

    setConfirmingJobId(
      null
    );

    setShowLocationPicker(
      false
    );

    if (
      newMode === "manual"
    ) {
      setLoading(
        true
      );

      try {
        const data =
          await api.searchJobs({
            mode: "manual",
          });

        setJobs(
          data.jobs || []
        );

        setHasSearched(
          true
        );
      } catch (
        err: any
      ) {
        setError(
          err?.message ||
            "Unable to load your manually added jobs."
        );
      } finally {
        setLoading(
          false
        );
      }
    }
  }

  // -----------------------------------------------------------
  // WORK TYPE
  // -----------------------------------------------------------

  function toggleWorkType(
    value: string
  ) {
    setSelectedWorkTypes(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.toLowerCase() ===
              value.toLowerCase()
          );

        if (exists) {
          return current.filter(
            (item) =>
              item.toLowerCase() !==
              value.toLowerCase()
          );
        }

        return [
          ...current,
          value,
        ];
      }
    );
  }

  // -----------------------------------------------------------
  // LOCATIONS
  // -----------------------------------------------------------

  function toggleLocation(
    value: string
  ) {
    setSelectedLocations(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.toLowerCase() ===
              value.toLowerCase()
          );

        if (exists) {
          return current.filter(
            (item) =>
              item.toLowerCase() !==
              value.toLowerCase()
          );
        }

        return [
          ...current,
          value,
        ];
      }
    );
  }

  function removeLocation(
    value: string
  ) {
    setSelectedLocations(
      (current) =>
        current.filter(
          (item) =>
            item.toLowerCase() !==
            value.toLowerCase()
        )
    );
  }

  function clearLocations() {
    setSelectedLocations(
      []
    );

    setLocationSearch(
      ""
    );
  }

  function addCustomLocation() {
    const value =
      locationSearch.trim();

    if (!value) {
      return;
    }

    const existing =
      allLocations.find(
        (item) =>
          item.toLowerCase() ===
          value.toLowerCase()
      );

    const finalValue =
      existing || value;

    if (!existing) {
      setCustomLocations(
        (current) => [
          ...current,
          value,
        ]
      );
    }

    setSelectedLocations(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.toLowerCase() ===
              finalValue.toLowerCase()
          );

        if (exists) {
          return current;
        }

        return [
          ...current,
          finalValue,
        ];
      }
    );

    setLocationSearch(
      ""
    );
  }

  // -----------------------------------------------------------
  // APPLY
  // -----------------------------------------------------------

  async function goApply(
    job: Job,
    e: React.MouseEvent
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (
      generatingKit
    ) {
      return;
    }

    const url =
      job.redirectUrl ||
      job.link;

    if (url) {
      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    }

    try {
      await api.clickApply(
        job._id
      );

      setConfirmingJobId(
        job._id
      );
    } catch (
      err: any
    ) {
      setError(
        err?.message ||
          "Unable to record the application."
      );
    }
  }

  // -----------------------------------------------------------
  // CONFIRM APPLICATION + GENERATE KIT
  // -----------------------------------------------------------

  async function confirm(
    jobId: string,
    applied: boolean,
    e: React.MouseEvent
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (
      generatingKit
    ) {
      return;
    }

    try {
      setError(
        ""
      );

      // -----------------------------------------------------
      // USER DID NOT APPLY
      // -----------------------------------------------------

      if (!applied) {
        await api.confirmApplied(
          jobId,
          false
        );

        setConfirmingJobId(
          null
        );

        return;
      }

      // -----------------------------------------------------
      // START PREPARATION FLOW
      // -----------------------------------------------------

      setGeneratingKit(
        true
      );

      setShowPreparingModal(
        true
      );

      setPreparingStage(
        "saving"
      );

      // -----------------------------------------------------
      // SAVE APPLICATION
      // -----------------------------------------------------

      const application =
        await api.confirmApplied(
          jobId,
          true
        );

      const applicationId =
        application?._id ||
        application?.id ||
        application?.application?._id ||
        application?.application?.id;

      if (!applicationId) {
        throw new Error(
          "Application was saved, but no application ID was returned."
        );
      }

      setConfirmingJobId(
        null
      );

      // -----------------------------------------------------
      // AI GENERATION
      // -----------------------------------------------------

      setPreparingStage(
        "generating"
      );

      await api.generateGuide(
        applicationId,
        60
      );

      // -----------------------------------------------------
      // READY STATE
      // -----------------------------------------------------

      setPreparingStage(
        "ready"
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );

      // -----------------------------------------------------
      // REDIRECT
      // -----------------------------------------------------

      navigate(
        `/applications/${applicationId}/prep`
      );
    } catch (
      err: any
    ) {
      console.error(
        "Interview kit generation error:",
        err
      );

      setShowPreparingModal(
        false
      );

      setError(
        err?.message ||
          "Unable to generate your interview preparation kit."
      );
    } finally {
      setGeneratingKit(
        false
      );
    }
  }

  // -----------------------------------------------------------
  // ADD MANUAL JOB
  // -----------------------------------------------------------

  async function addManualJob(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      await api.createJob(
        form
      );

      setForm({
        title: "",
        company: "",
        description: "",
        link: "",
      });

      setShowManualForm(
        false
      );

      if (
        mode === "manual"
      ) {
        const data =
          await api.searchJobs({
            mode: "manual",
          });

        setJobs(
          data.jobs || []
        );

        setHasSearched(
          true
        );
      }
    } catch (
      err: any
    ) {
      setError(
        err?.message ||
          "Unable to add the job."
      );
    }
  }

  // ===========================================================
  // UI
  // ===========================================================

  return (
    <div
      style={{
        maxWidth:
          "1200px",
        margin:
          "0 auto",
        padding:
          "8px 0 40px",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom:
            "24px",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 6px",
            color:
              "#111827",
          }}
        >
          Find Your Next Job
        </h2>

        <p
          style={{
            margin: 0,
            color:
              "#6b7280",
          }}
        >
          Search jobs your way and
          choose resume matching whenever
          you need it.
        </p>
      </div>

      {/* =====================================================
          SEARCH MODE SWITCHER
      ===================================================== */}

      <div
        className="card"
        style={{
          marginBottom:
            "18px",
          padding:
            "10px",
        }}
      >
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap:
              "10px",
          }}
        >
          {/* RESUME */}

          <button
            type="button"
            onClick={() =>
              changeMode(
                "resume"
              )
            }
            style={{
              minHeight:
                "92px",
              textAlign:
                "left",
              border:
                mode === "resume"
                  ? "2px solid #4f46e5"
                  : "1px solid #e5e7eb",
              background:
                mode === "resume"
                  ? "#eef2ff"
                  : "#ffffff",
              color:
                "#111827",
              borderRadius:
                "12px",
              padding:
                "14px",
              cursor:
                "pointer",
            }}
          >
            <div
              style={{
                fontSize:
                  "22px",
                marginBottom:
                  "6px",
              }}
            >
              🎯
            </div>

            <strong>
              Match My Resume
            </strong>

            <div
              style={{
                fontSize:
                  "12px",
                color:
                  "#6b7280",
                marginTop:
                  "4px",
              }}
            >
              Upload, analyze & AI-match
            </div>
          </button>

          {/* NORMAL */}

          <button
            type="button"
            onClick={() =>
              changeMode(
                "normal"
              )
            }
            style={{
              minHeight:
                "92px",
              textAlign:
                "left",
              border:
                mode === "normal"
                  ? "2px solid #4f46e5"
                  : "1px solid #e5e7eb",
              background:
                mode === "normal"
                  ? "#eef2ff"
                  : "#ffffff",
              color:
                "#111827",
              borderRadius:
                "12px",
              padding:
                "14px",
              cursor:
                "pointer",
            }}
          >
            <div
              style={{
                fontSize:
                  "22px",
                marginBottom:
                  "6px",
              }}
            >
              🔎
            </div>

            <strong>
              Search Jobs
            </strong>

            <div
              style={{
                fontSize:
                  "12px",
                color:
                  "#6b7280",
                marginTop:
                  "4px",
              }}
            >
              Search without a resume
            </div>
          </button>

          {/* MANUAL */}

          <button
            type="button"
            onClick={() =>
              changeMode(
                "manual"
              )
            }
            style={{
              minHeight:
                "92px",
              textAlign:
                "left",
              border:
                mode === "manual"
                  ? "2px solid #4f46e5"
                  : "1px solid #e5e7eb",
              background:
                mode === "manual"
                  ? "#eef2ff"
                  : "#ffffff",
              color:
                "#111827",
              borderRadius:
                "12px",
              padding:
                "14px",
              cursor:
                "pointer",
            }}
          >
            <div
              style={{
                fontSize:
                  "22px",
                marginBottom:
                  "6px",
              }}
            >
              ➕
            </div>

            <strong>
              My Added Jobs
            </strong>

            <div
              style={{
                fontSize:
                  "12px",
                color:
                  "#6b7280",
                marginTop:
                  "4px",
              }}
            >
              Manage your manual jobs
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================
          RESUME MATCH PANEL
      ===================================================== */}

      {mode === "resume" && (
        <div
          className="card"
          style={{
            marginBottom:
              "20px",
            border:
              "1px solid #c7d2fe",
            background:
              "#f8f9ff",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap:
                "12px",
              flexWrap:
                "wrap",
              marginBottom:
                "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin:
                    "0 0 5px",
                  color:
                    "#312e81",
                }}
              >
                🎯 Match Jobs to My Resume
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    "#6b7280",
                  fontSize:
                    "13px",
                }}
              >
                Upload your resume once.
                We'll analyze your skills and
                automatically find suitable
                job roles.
              </p>
            </div>

            {resumeAnalyzed && (
              <span
                style={{
                  padding:
                    "6px 11px",
                  borderRadius:
                    "20px",
                  background:
                    "#ecfdf5",
                  border:
                    "1px solid #a7f3d0",
                  color:
                    "#047857",
                  fontWeight:
                    700,
                  fontSize:
                    "12px",
                }}
              >
                ✓ Resume analyzed
              </span>
            )}
          </div>

          {/* RESUME UPLOAD */}

          <div
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius:
                "12px",
              padding:
                "16px",
              marginBottom:
                "16px",
            }}
          >
            <label
              htmlFor="jobs-resume-upload"
              style={{
                display:
                  "block",
                fontSize:
                  "13px",
                fontWeight:
                  700,
                color:
                  "#374151",
                marginBottom:
                  "8px",
              }}
            >
              Upload your resume
            </label>

            <input
              id="jobs-resume-upload"
              name="jobs-resume-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => {
                const file =
                  e.target.files?.[0] ||
                  null;

                setResumeFile(
                  file
                );

                if (file) {
                  setResumeStatus(
                    `${file.name} selected. Click Upload & Analyze.`
                  );
                }
              }}
              disabled={
                resumeUploading
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                padding:
                  "10px",
                border:
                  "1px dashed #c7d2fe",
                borderRadius:
                  "9px",
                background:
                  "#f8f9ff",
              }}
            />

            {resumeFile && (
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                  marginTop:
                    "10px",
                  padding:
                    "10px 12px",
                  background:
                    "#f9fafb",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "8px",
                }}
              >
                <span
                  style={{
                    fontSize:
                      "13px",
                    color:
                      "#374151",
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  📄{" "}
                  {resumeFile.name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setResumeFile(
                      null
                    )
                  }
                  disabled={
                    resumeUploading
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#dc2626",
                    cursor:
                      "pointer",
                    fontWeight:
                      700,
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                marginTop:
                  "12px",
              }}
            >
              <button
                type="button"
                onClick={
                  uploadAndAnalyzeResume
                }
                disabled={
                  !resumeFile ||
                  resumeUploading
                }
                style={{
                  padding:
                    "10px 16px",
                  border:
                    "none",
                  borderRadius:
                    "8px",
                  background:
                    "#4f46e5",
                  color:
                    "#ffffff",
                  cursor:
                    !resumeFile ||
                    resumeUploading
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !resumeFile ||
                    resumeUploading
                      ? 0.65
                      : 1,
                  fontWeight:
                    700,
                }}
              >
                {resumeUploading
                  ? "Analyzing..."
                  : "Upload & Analyze"}
              </button>
            </div>

            {resumeStatus && (
              <p
                style={{
                  margin:
                    "10px 0 0",
                  color:
                    resumeStatus.includes(
                      "successfully"
                    ) ||
                    resumeStatus.includes(
                      "already"
                    )
                      ? "#047857"
                      : "#6b7280",
                  fontSize:
                    "13px",
                }}
              >
                {resumeStatus}
              </p>
            )}
          </div>

          {/* DETECTED SKILLS */}

          {resumeSkills.length >
            0 && (
            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "12px",
                padding:
                  "16px",
                marginBottom:
                  "12px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  marginBottom:
                    "10px",
                }}
              >
                <h4
                  style={{
                    margin:
                      0,
                    color:
                      "#111827",
                  }}
                >
                  Detected Skills
                </h4>

                <span
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#6b7280",
                  }}
                >
                  {
                    resumeSkills.length
                  }{" "}
                  skills
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "7px",
                  flexWrap:
                    "wrap",
                }}
              >
                {resumeSkills.map(
                  (
                    skill
                  ) => (
                    <span
                      key={
                        skill
                      }
                      style={{
                        padding:
                          "6px 10px",
                        borderRadius:
                          "18px",
                        background:
                          "#eef2ff",
                        border:
                          "1px solid #c7d2fe",
                        color:
                          "#3730a3",
                        fontSize:
                          "12px",
                        fontWeight:
                          600,
                      }}
                    >
                      {
                        skill
                      }
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {resumeAnalyzed && (
            <div
              style={{
                marginTop:
                  "12px",
                padding:
                  "11px 13px",
                borderRadius:
                  "9px",
                background:
                  "#eef6ff",
                border:
                  "1px solid #bfdbfe",
                color:
                  "#1e40af",
                fontSize:
                  "13px",
              }}
            >
              Your resume is ready.
              The job roles will be
              determined automatically
              from your resume.
              You only need to choose
              the filters below.
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      {mode !== "manual" && (
        <div
          className="card"
          style={{
            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap:
                "12px",
              flexWrap:
                "wrap",
              marginBottom:
                "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin:
                    "0 0 4px",
                  color:
                    "#111827",
                }}
              >
                {mode ===
                "resume"
                  ? "Job Matching Filters"
                  : "Search Jobs"}
              </h3>

              <p
                style={{
                  margin: 0,
                  color:
                    "#6b7280",
                  fontSize:
                    "13px",
                }}
              >
                {mode ===
                "resume"
                  ? "Fine-tune your resume-based job results."
                  : "Search by keyword, role and job filters."}
              </p>
            </div>
          </div>

          {/* NORMAL SEARCH */}

          {mode === "normal" && (
            <>
              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <label
                  htmlFor="job-search-query"
                  style={{
                    display:
                      "block",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    color:
                      "#374151",
                    marginBottom:
                      "6px",
                  }}
                >
                  Search
                </label>

                <input
                  id="job-search-query"
                  name="job-search-query"
                  type="text"
                  placeholder="e.g. React Developer, Full Stack Developer, Python"
                  value={
                    query
                  }
                  onChange={(e) =>
                    setQuery(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      runSearch(
                        "normal"
                      );
                    }
                  }}
                  autoComplete="off"
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    height:
                      "46px",
                    padding:
                      "0 13px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "9px",
                    color:
                      "#111827",
                    background:
                      "#ffffff",
                    fontSize:
                      "14px",
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <label
                  htmlFor="job-role"
                  style={{
                    display:
                      "block",
                    fontSize:
                      "13px",
                    fontWeight:
                      700,
                    color:
                      "#374151",
                    marginBottom:
                      "6px",
                  }}
                >
                  Role
                </label>

                <select
                  id="job-role"
                  name="job-role"
                  value={
                    role
                  }
                  onChange={(e) =>
                    setRole(
                      e.target.value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      "46px",
                    padding:
                      "0 12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "9px",
                    color:
                      "#111827",
                    background:
                      "#ffffff",
                    fontSize:
                      "14px",
                  }}
                >
                  {ROLE_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value ||
                          "any-role"
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </>
          )}

          {/* EXPERIENCE */}

          <div
            style={{
              marginBottom:
                "16px",
            }}
          >
            <label
              htmlFor="job-experience"
              style={{
                display:
                  "block",
                fontSize:
                  "13px",
                fontWeight:
                  700,
                color:
                  "#374151",
                marginBottom:
                  "6px",
              }}
            >
              Experience
            </label>

            <select
              id="job-experience"
              name="job-experience"
              value={
                experience
              }
              onChange={(e) =>
                setExperience(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                height:
                  "46px",
                padding:
                  "0 12px",
                border:
                  "1px solid #d1d5db",
                borderRadius:
                  "9px",
                color:
                  "#111827",
                background:
                  "#ffffff",
                fontSize:
                  "14px",
              }}
            >
              {EXPERIENCE_OPTIONS.map(
                (
                  option
                ) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* WORK TYPE */}

          <div
            style={{
              marginBottom:
                "16px",
            }}
          >
            <label
              style={{
                display:
                  "block",
                fontSize:
                  "13px",
                fontWeight:
                  700,
                color:
                  "#374151",
                marginBottom:
                  "7px",
              }}
            >
              Work type
            </label>

            <div
              style={{
                display:
                  "flex",
                gap:
                  "8px",
                flexWrap:
                  "wrap",
              }}
            >
              {WORK_TYPES.map(
                (
                  workType
                ) => {
                  const selected =
                    selectedWorkTypes.includes(
                      workType
                    );

                  return (
                    <button
                      key={
                        workType
                      }
                      type="button"
                      onClick={() =>
                        toggleWorkType(
                          workType
                        )
                      }
                      style={{
                        padding:
                          "9px 14px",
                        borderRadius:
                          "20px",
                        border:
                          selected
                            ? "1px solid #6366f1"
                            : "1px solid #d1d5db",
                        background:
                          selected
                            ? "#eef2ff"
                            : "#ffffff",
                        color:
                          selected
                            ? "#3730a3"
                            : "#374151",
                        fontSize:
                          "13px",
                        fontWeight:
                          selected
                            ? 700
                            : 500,
                        cursor:
                          "pointer",
                      }}
                    >
                      {selected
                        ? "✓ "
                        : ""}
                      {
                        workType
                      }
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* LOCATION */}

          <div
            style={{
              marginBottom:
                "16px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "7px",
              }}
            >
              <label
                style={{
                  fontSize:
                    "13px",
                  fontWeight:
                    700,
                  color:
                    "#374151",
                }}
              >
                Location
              </label>

              <span
                style={{
                  color:
                    "#9ca3af",
                  fontSize:
                    "12px",
                }}
              >
                Multiple locations supported
              </span>
            </div>

            <div
              style={{
                minHeight:
                  "52px",
                border:
                  "1px solid #d1d5db",
                borderRadius:
                  "9px",
                background:
                  "#ffffff",
                padding:
                  "7px 9px",
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  "6px",
                flexWrap:
                  "wrap",
              }}
            >
              {selectedLocations.length ===
              0 ? (
                <span
                  style={{
                    color:
                      "#6b7280",
                    fontSize:
                      "14px",
                    padding:
                      "6px",
                    flex: 1,
                  }}
                >
                  All locations
                </span>
              ) : (
                selectedLocations.map(
                  (
                    selectedLocation
                  ) => (
                    <span
                      key={
                        selectedLocation
                      }
                      style={{
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        gap:
                          "5px",
                        padding:
                          "6px 10px",
                        borderRadius:
                          "18px",
                        background:
                          "#eef2ff",
                        border:
                          "1px solid #c7d2fe",
                        color:
                          "#3730a3",
                        fontSize:
                          "13px",
                        fontWeight:
                          600,
                      }}
                    >
                      📍{" "}
                      {
                        selectedLocation
                      }

                      <button
                        type="button"
                        onClick={() =>
                          removeLocation(
                            selectedLocation
                          )
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "transparent",
                          color:
                            "#3730a3",
                          cursor:
                            "pointer",
                          padding:
                            0,
                          fontSize:
                            "15px",
                          fontWeight:
                            700,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  )
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setShowLocationPicker(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                style={{
                  marginLeft:
                    "auto",
                  padding:
                    "8px 12px",
                  border:
                    "1px solid #6366f1",
                  borderRadius:
                    "7px",
                  background:
                    "#6366f1",
                  color:
                    "#ffffff",
                  cursor:
                    "pointer",
                  fontWeight:
                    700,
                  fontSize:
                    "13px",
                }}
              >
                + Select
              </button>
            </div>

            {/* LOCATION PICKER */}

            {showLocationPicker && (
              <div
                style={{
                  marginTop:
                    "7px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "9px",
                  background:
                    "#ffffff",
                  padding:
                    "12px",
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,0.08)",
                }}
              >
                <input
                  id="location-picker-search"
                  name="location-picker-search"
                  type="text"
                  placeholder="Search or add a location..."
                  value={
                    locationSearch
                  }
                  onChange={(e) =>
                    setLocationSearch(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      e.preventDefault();
                      addCustomLocation();
                    }
                  }}
                  autoComplete="off"
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    height:
                      "42px",
                    padding:
                      "0 11px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "8px",
                    color:
                      "#111827",
                    background:
                      "#ffffff",
                  }}
                />

                <div
                  style={{
                    maxHeight:
                      "220px",
                    overflowY:
                      "auto",
                    marginTop:
                      "8px",
                  }}
                >
                  {filteredLocations.length >
                  0 ? (
                    filteredLocations.map(
                      (
                        locationItem
                      ) => {
                        const selected =
                          selectedLocations.some(
                            (
                              item
                            ) =>
                              item.toLowerCase() ===
                              locationItem.toLowerCase()
                          );

                        const inputId =
                          `job-location-${locationItem
                            .toLowerCase()
                            .replace(
                              /[^a-z0-9]+/g,
                              "-"
                            )}`;

                        return (
                          <label
                            htmlFor={
                              inputId
                            }
                            key={
                              locationItem
                            }
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              minHeight:
                                "42px",
                              padding:
                                "8px 9px",
                              borderRadius:
                                "7px",
                              background:
                                selected
                                  ? "#eef2ff"
                                  : "#ffffff",
                              color:
                                "#111827",
                              cursor:
                                "pointer",
                              marginBottom:
                                "3px",
                            }}
                          >
                            <input
                              id={
                                inputId
                              }
                              name={
                                inputId
                              }
                              type="checkbox"
                              checked={
                                selected
                              }
                              onChange={() =>
                                toggleLocation(
                                  locationItem
                                )
                              }
                              style={{
                                width:
                                  "16px",
                                height:
                                  "16px",
                                marginRight:
                                  "9px",
                                accentColor:
                                  "#4f46e5",
                              }}
                            />

                            <span>
                              📍{" "}
                              {
                                locationItem
                              }
                            </span>

                            {selected && (
                              <span
                                style={{
                                  marginLeft:
                                    "auto",
                                  color:
                                    "#4f46e5",
                                  fontWeight:
                                    800,
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </label>
                        );
                      }
                    )
                  ) : (
                    <p
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                        margin:
                          "10px 4px",
                      }}
                    >
                      No matching
                      location.
                    </p>
                  )}
                </div>

                {locationSearch.trim() && (
                  <button
                    type="button"
                    onClick={
                      addCustomLocation
                    }
                    style={{
                      width:
                        "100%",
                      marginTop:
                        "8px",
                      padding:
                        "9px 10px",
                      border:
                        "1px dashed #6366f1",
                      borderRadius:
                        "7px",
                      background:
                        "#f5f3ff",
                      color:
                        "#4338ca",
                      textAlign:
                        "left",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    + Add "
                    {
                      locationSearch.trim()
                    }
                    "
                  </button>
                )}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginTop:
                      "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      clearLocations
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#dc2626",
                      cursor:
                        "pointer",
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                    }}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowLocationPicker(
                        false
                      )
                    }
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DATE POSTED */}

          <div
            style={{
              marginBottom:
                "18px",
            }}
          >
            <label
              style={{
                display:
                  "block",
                fontSize:
                  "13px",
                fontWeight:
                  700,
                color:
                  "#374151",
                marginBottom:
                  "7px",
              }}
            >
              Date posted
            </label>

            <div
              style={{
                display:
                  "flex",
                gap:
                  "7px",
                flexWrap:
                  "wrap",
              }}
            >
              {DATE_FILTERS.map(
                (
                  item
                ) => {
                  const active =
                    datePosted ===
                    item.value;

                  return (
                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        setDatePosted(
                          item.value
                        )
                      }
                      style={{
                        padding:
                          "8px 12px",
                        borderRadius:
                          "18px",
                        border:
                          active
                            ? "1px solid #6366f1"
                            : "1px solid #d1d5db",
                        background:
                          active
                            ? "#eef2ff"
                            : "#ffffff",
                        color:
                          active
                            ? "#3730a3"
                            : "#374151",
                        cursor:
                          "pointer",
                        fontSize:
                          "13px",
                        fontWeight:
                          active
                            ? 700
                            : 500,
                      }}
                    >
                      {
                        item.label
                      }
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* SEARCH BUTTON */}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
            }}
          >
            <button
              type="button"
              disabled={
                loading ||
                (
                  mode ===
                  "resume" &&
                  !resumeAnalyzed
                )
              }
              onClick={() =>
                runSearch()
              }
              style={{
                minWidth:
                  "190px",
                padding:
                  "11px 20px",
                border:
                  "none",
                borderRadius:
                  "8px",
                background:
                  "#4f46e5",
                color:
                  "#ffffff",
                cursor:
                  loading ||
                  (
                    mode ===
                    "resume" &&
                    !resumeAnalyzed
                  )
                    ? "not-allowed"
                    : "pointer",
                fontWeight:
                  700,
                opacity:
                  loading ||
                  (
                    mode ===
                    "resume" &&
                    !resumeAnalyzed
                  )
                    ? 0.65
                    : 1,
              }}
            >
              {loading
                ? "Searching..."
                : mode ===
                  "resume"
                ? "Find Matching Jobs"
                : "Search Jobs"}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          MANUAL FORM
      ===================================================== */}

      {mode === "manual" &&
        showManualForm && (
          <form
            className="card"
            onSubmit={
              addManualJob
            }
            style={{
              marginBottom:
                "18px",
            }}
          >
            <h3>
              Add a Job
            </h3>

            <input
              id="manual-job-title"
              name="manual-job-title"
              placeholder="Job title"
              value={
                form.title
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  title:
                    e.target.value,
                })
              }
              required
            />

            <input
              id="manual-company"
              name="manual-company"
              placeholder="Company"
              value={
                form.company
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  company:
                    e.target.value,
                })
              }
              required
            />

            <input
              id="manual-job-link"
              name="manual-job-link"
              placeholder="Job posting link"
              value={
                form.link
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  link:
                    e.target.value,
                })
              }
            />

            <textarea
              id="manual-job-description"
              name="manual-job-description"
              placeholder="Paste the full job description"
              rows={7}
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              required
            />

            <button
              type="submit"
            >
              Save Job
            </button>
          </form>
        )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="card error-card"
          style={{
            marginBottom:
              "16px",
          }}
        >
          <p className="error">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div
          className="card"
          style={{
            textAlign:
              "center",
            padding:
              "28px",
            marginBottom:
              "18px",
          }}
        >
          <div
            style={{
              fontSize:
                "28px",
              marginBottom:
                "8px",
            }}
          >
            🔎
          </div>

          <strong>
            Finding jobs...
          </strong>

          <p className="status">
            Applying your selected
            filters.
          </p>
        </div>
      )}

      {/* =====================================================
          BEFORE SEARCH
      ===================================================== */}

      {!loading &&
        !hasSearched &&
        mode !== "manual" && (
          <div
            className="card"
            style={{
              textAlign:
                "center",
              padding:
                "42px 20px",
            }}
          >
            <div
              style={{
                fontSize:
                  "42px",
                marginBottom:
                  "12px",
              }}
            >
              💼
            </div>

            <h3>
              Ready to search
            </h3>

            <p
              style={{
                color:
                  "#6b7280",
                maxWidth:
                  "560px",
                margin:
                  "0 auto",
              }}
            >
              {mode ===
              "resume"
                ? "Analyze your resume, choose your experience, work type, location and date filters, then find matching jobs."
                : "Search jobs normally without uploading a resume. Choose your keyword, role and filters, then search."}
            </p>
          </div>
        )}

      {/* =====================================================
          MANUAL EMPTY
      ===================================================== */}

      {!loading &&
        mode === "manual" &&
        jobs.length === 0 && (
          <div
            className="card"
            style={{
              textAlign:
                "center",
              padding:
                "40px 20px",
            }}
          >
            <div
              style={{
                fontSize:
                  "40px",
              }}
            >
              📂
            </div>

            <h3>
              No manually added
              jobs yet
            </h3>

            <p className="status">
              Add a job to keep it
              inside ApplyPilot.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowManualForm(
                  true
                )
              }
            >
              + Add your first job
            </button>
          </div>
        )}

      {/* =====================================================
          RESULTS HEADER
      ===================================================== */}

      {!loading &&
        hasSearched &&
        jobs.length > 0 && (
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "12px",
            }}
          >
            <div>
              <strong>
                {jobs.length}{" "}
                {
                  mode ===
                  "manual"
                    ? "saved jobs"
                    : "jobs found"
                }
              </strong>

              {mode ===
                "resume" && (
                <span
                  style={{
                    marginLeft:
                      "8px",
                    color:
                      "#4f46e5",
                    fontSize:
                      "13px",
                    fontWeight:
                      600,
                  }}
                >
                  AI matched
                </span>
              )}
            </div>
          </div>
        )}

      {/* =====================================================
          JOB LIST
      ===================================================== */}

      <div
        className="job-list"
      >
        {jobs.map(
          (job) => {
            const workType =
              getWorkTypeLabel(
                job
              );

            return (
              <div
                className="job-card-wrap"
                key={
                  job._id
                }
              >
                <div
                  className="job-card"
                >
                  <Link
                    to={`/jobs/${job._id}`}
                    className="job-card-main"
                  >
                    <div className="row-between">
                      <h3>
                        {
                          job.title
                        }
                      </h3>

                      <span className="posted-badge">
                        {timeAgo(
                          job.postedAt
                        )}
                      </span>
                    </div>

                    <p>
                      {
                        job.company
                      }

                      {job.location
                        ? ` · ${job.location}`
                        : ""}
                    </p>

                    <div className="chip-row">
                      <span className="badge">
                        {
                          job.sourcePlatform ||
                          "Job listing"
                        }
                      </span>

                      {job.relevanceScore !=
                        null && (
                        <span className="badge">
                          {mode ===
                          "resume"
                            ? `Match ${job.relevanceScore}%`
                            : `Relevance ${job.relevanceScore}%`}
                        </span>
                      )}

                      {workType && (
                        <span className="badge">
                          {
                            workType
                          }
                        </span>
                      )}

                      {job.salaryMin && (
                        <span className="badge">
                          ₹
                          {Math.round(
                            job.salaryMin /
                              1000
                          )}
                          k
                          {job.salaryMax
                            ? `–₹${Math.round(
                                job.salaryMax /
                                  1000
                              )}k`
                            : "+"}
                        </span>
                      )}
                    </div>

                    {job.relevanceReason && (
                      <p className="why">
                        {
                          job.relevanceReason
                        }
                      </p>
                    )}
                  </Link>

                  <div className="job-card-actions">
                    <button
                      type="button"
                      disabled={
                        generatingKit
                      }
                      onClick={(e) =>
                        goApply(
                          job,
                          e
                        )
                      }
                    >
                      Apply on original
                      listing →
                    </button>
                  </div>
                </div>

                {/* =================================================
                    APPLICATION CONFIRMATION
                ================================================= */}

                {confirmingJobId ===
                  job._id && (
                  <div
                    className="confirm-bar"
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <span>
                      Did you complete
                      the application?
                    </span>

                    <button
                      type="button"
                      disabled={
                        generatingKit
                      }
                      onClick={(e) =>
                        confirm(
                          job._id,
                          true,
                          e
                        )
                      }
                    >
                      ✅ Yes, I applied
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      disabled={
                        generatingKit
                      }
                      onClick={(e) =>
                        confirm(
                          job._id,
                          false,
                          e
                        )
                      }
                    >
                      Not yet
                    </button>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* =====================================================
          PREPARING INTERVIEW KIT MODAL
      ===================================================== */}

      {showPreparingModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preparing-modal-title"
          style={{
            background:
              "rgba(15, 23, 42, 0.58)",
            backdropFilter:
              "blur(5px)",
          }}
        >
          <div
            className="preparing-modal"
          >
            {/* =================================================
                SAVING
            ================================================= */}

            {preparingStage ===
              "saving" && (
              <>
                <div className="preparing-icon preparing-icon-saving">
                  ✓
                </div>

                <span className="preparing-label">
                  APPLICATION SAVED
                </span>

                <h2 id="preparing-modal-title">
                  Preparing your interview kit
                </h2>

                <p>
                  We’ve recorded your
                  application. Now we’re
                  getting your personalized
                  interview preparation
                  ready.
                </p>

                <div className="preparing-progress">
                  <span />
                </div>

                <div className="preparing-step">
                  <span>
                    ✓
                  </span>

                  Application successfully
                  recorded
                </div>
              </>
            )}

            {/* =================================================
                GENERATING
            ================================================= */}

            {preparingStage ===
              "generating" && (
              <>
                <div className="preparing-loader">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="preparing-label">
                  AI PREPARATION
                </span>

                <h2 id="preparing-modal-title">
                  Building your interview kit
                </h2>

                <p>
                  Creating personalized
                  technical, project,
                  behavioral and skill-gap
                  questions from the job
                  description and your resume.
                </p>

                <div className="preparing-check-list">
                  <div>
                    <span>
                      ✓
                    </span>

                    Resume analyzed
                  </div>

                  <div>
                    <span>
                      ✓
                    </span>

                    Job requirements reviewed
                  </div>

                  <div>
                    <span className="preparing-pulse">
                      •
                    </span>

                    Creating interview questions
                  </div>
                </div>
              </>
            )}

            {/* =================================================
                READY
            ================================================= */}

            {preparingStage ===
              "ready" && (
              <>
                <div className="preparing-icon preparing-icon-ready">
                  🎯
                </div>

                <span className="preparing-label preparing-ready-label">
                  READY
                </span>

                <h2 id="preparing-modal-title">
                  Your interview kit is ready
                </h2>

                <p>
                  Your personalized
                  interview preparation
                  guide has been created
                  successfully.
                </p>

                <div className="preparing-ready-note">
                  Redirecting you to your
                  interview preparation...
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}