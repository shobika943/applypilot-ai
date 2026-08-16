import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { api } from "../api/client";

export default function AddJob() {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      title: "",
      company: "",
      description: "",
      link: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function updateField(
    field:
      | "title"
      | "company"
      | "description"
      | "link",
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function submit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await api.createJob({
        title:
          form.title.trim(),

        company:
          form.company.trim(),

        description:
          form.description.trim(),

        link:
          form.link.trim(),
      });

      setSuccess(true);

      setForm({
        title: "",
        company: "",
        description: "",
        link: "",
      });
    } catch (err: any) {
      console.error(
        "Add job error:",
        err
      );

      setError(
        err?.message ||
          "Unable to add this job."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MANUAL JOB ENTRY
          </span>

          <h1>
            Add a Job
          </h1>

          <p>
            Found a job outside the
            search results? Save it here
            and keep it inside your
            ApplyPilot workspace.
          </p>
        </div>

        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "18px",
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(135deg, #eef2ff, #f5f3ff)",
            border:
              "1px solid #e0e7ff",
            fontSize: "30px",
            boxShadow:
              "0 10px 30px rgba(79,70,229,0.10)",
          }}
        >
          ➕
        </div>
      </div>

      {/* =====================================================
          SUCCESS
          ===================================================== */}

      {success && (
        <div
          className="card"
          style={{
            marginBottom:
              "18px",

            border:
              "1px solid #bbf7d0",

            background:
              "#f0fdf4",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "flex-start",

              gap:
                "12px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius:
                  "12px",

                display:
                  "grid",

                placeItems:
                  "center",

                background:
                  "#dcfce7",

                fontSize:
                  "18px",
              }}
            >
              ✓
            </div>

            <div>
              <strong
                style={{
                  display:
                    "block",

                  marginBottom:
                    "4px",

                  color:
                    "#166534",
                }}
              >
                Job added successfully
              </strong>

              <span
                style={{
                  color:
                    "#4d7c5f",

                  fontSize:
                    "0.84rem",
                }}
              >
                The job has been saved to
                your ApplyPilot workspace.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          className="card error-card"
          style={{
            marginBottom:
              "18px",
          }}
        >
          <p className="error">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          FORM
          ===================================================== */}

      <form
        className="card"
        onSubmit={submit}
        style={{
          maxWidth:
            "900px",

          margin:
            "0 auto 24px",
        }}
      >
        <div
          style={{
            marginBottom:
              "20px",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 6px",
            }}
          >
            Job details
          </h2>

          <p
            className="status"
            style={{
              margin: 0,
            }}
          >
            Add the information from
            the original job posting.
          </p>
        </div>

        {/* ===================================================
            TITLE / COMPANY
            =================================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1fr 1fr",

            gap:
              "16px",
          }}
        >
          <div>
            <label
              htmlFor="add-job-title"
              style={{
                display:
                  "block",

                marginBottom:
                  "6px",

                fontSize:
                  "0.8rem",

                fontWeight:
                  750,

                color:
                  "#374151",
              }}
            >
              Job title
            </label>

            <input
              id="add-job-title"
              name="add-job-title"
              type="text"
              placeholder="e.g. React Developer"
              value={
                form.title
              }
              onChange={(e) =>
                updateField(
                  "title",
                  e.target.value
                )
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="add-job-company"
              style={{
                display:
                  "block",

                marginBottom:
                  "6px",

                fontSize:
                  "0.8rem",

                fontWeight:
                  750,

                color:
                  "#374151",
              }}
            >
              Company
            </label>

            <input
              id="add-job-company"
              name="add-job-company"
              type="text"
              placeholder="e.g. ABC Technologies"
              value={
                form.company
              }
              onChange={(e) =>
                updateField(
                  "company",
                  e.target.value
                )
              }
              required
            />
          </div>
        </div>

        {/* ===================================================
            LINK
            =================================================== */}

        <div
          style={{
            marginTop:
              "16px",
          }}
        >
          <label
            htmlFor="add-job-link"
            style={{
              display:
                "block",

              marginBottom:
                "6px",

              fontSize:
                "0.8rem",

              fontWeight:
                750,

              color:
                "#374151",
            }}
          >
            Job posting link
            <span
              style={{
                marginLeft:
                  "5px",

                color:
                  "#9ca3af",

                fontWeight:
                  500,
              }}
            >
              Optional
            </span>
          </label>

          <input
            id="add-job-link"
            name="add-job-link"
            type="url"
            placeholder="https://example.com/job-posting"
            value={
              form.link
            }
            onChange={(e) =>
              updateField(
                "link",
                e.target.value
              )
            }
          />
        </div>

        {/* ===================================================
            DESCRIPTION
            =================================================== */}

        <div
          style={{
            marginTop:
              "16px",
          }}
        >
          <label
            htmlFor="add-job-description"
            style={{
              display:
                "block",

              marginBottom:
                "6px",

              fontSize:
                "0.8rem",

              fontWeight:
                750,

              color:
                "#374151",
            }}
          >
            Job description
          </label>

          <textarea
            id="add-job-description"
            name="add-job-description"
            rows={11}
            placeholder="Paste the complete job description here..."
            value={
              form.description
            }
            onChange={(e) =>
              updateField(
                "description",
                e.target.value
              )
            }
            required
          />
        </div>

        {/* ===================================================
            INFO
            =================================================== */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-start",

            gap:
              "10px",

            marginTop:
              "16px",

            padding:
              "12px 14px",

            border:
              "1px solid #e0e7ff",

            borderRadius:
              "12px",

            background:
              "#f8faff",
          }}
        >
          <span
            style={{
              fontSize:
                "1rem",
            }}
          >
            💡
          </span>

          <p
            style={{
              margin: 0,

              color:
                "#5b6475",

              fontSize:
                "0.78rem",

              lineHeight:
                "1.5",
            }}
          >
            Adding the full job
            description helps ApplyPilot
            keep enough information for
            matching and interview
            preparation later.
          </p>
        </div>

        {/* ===================================================
            ACTIONS
            =================================================== */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "flex-end",

            gap:
              "10px",

            marginTop:
              "22px",

            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            className="secondary"
            onClick={() =>
              navigate(
                "/jobs"
              )
            }
            disabled={
              loading
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              loading
            }
            style={{
              minWidth:
                "145px",
            }}
          >
            {loading
              ? "Saving..."
              : "Save Job"}
          </button>
        </div>
      </form>
    </div>
  );
}