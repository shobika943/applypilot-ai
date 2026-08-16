import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import Logo from "../components/Logo";
import Avatar, {
  AvatarStyle,
} from "../components/Avatar";

type AuthMode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [avatarStyle, setAvatarStyle] =
    useState<AvatarStyle>("neutral");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data =
        mode === "login"
          ? await api.login({
              email,
              password,
            })
          : await api.register({
              name,
              email,
              password,
              avatarStyle,
            });

      localStorage.setItem(
        "token",
        data.token
      );

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(
            data.user
          )
        );
      }

      navigate("/jobs", {
        replace: true,
      });
    } catch (err: any) {
      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(
    nextMode: AuthMode
  ) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-background auth-background-one" />
      <div className="auth-background auth-background-two" />

      <div className="auth-layout">
        <section className="auth-hero">
          <div className="auth-brand">
            <span className="auth-brand-mark">
              <Logo size={38} />
            </span>

            <div>
              <div className="auth-brand-name">
                ApplyPilot
                <span>AI</span>
              </div>

              <div className="auth-brand-tagline">
                Your career, guided intelligently.
              </div>
            </div>
          </div>

          <div className="auth-hero-content">
            <span className="auth-kicker">
              SMART JOB DISCOVERY
            </span>

            <h1>
              Find the right
              opportunity.
              <br />
              Prepare with confidence.
            </h1>

            <p>
              Match your resume with
              relevant jobs, organize
              applications, prepare
              personalized interview kits,
              and practice before the real
              interview.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon">
                  🎯
                </span>

                <div>
                  <strong>
                    Resume Matching
                  </strong>

                  <span>
                    Let AI discover jobs
                    aligned with your skills.
                  </span>
                </div>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon">
                  📋
                </span>

                <div>
                  <strong>
                    Application Tracking
                  </strong>

                  <span>
                    Keep your opportunities
                    organized in one place.
                  </span>
                </div>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon">
                  🎤
                </span>

                <div>
                  <strong>
                    Interview Practice
                  </strong>

                  <span>
                    Prepare with job-specific
                    questions and mock interviews.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <span>
              Built for focused job seekers
            </span>

            <span>
              •
            </span>

            <span>
              Resume
            </span>

            <span>
              •
            </span>

            <span>
              Jobs
            </span>

            <span>
              •
            </span>

            <span>
              Interviews
            </span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card-modern">
            <div className="auth-mobile-brand">
              <span className="auth-mobile-logo">
                <Logo size={32} />
              </span>

              <div>
                <strong>
                  ApplyPilot
                </strong>

                <span>
                  AI
                </span>
              </div>
            </div>

            <div className="auth-heading">
              <span className="auth-small-label">
                {mode === "login"
                  ? "WELCOME BACK"
                  : "GET STARTED"}
              </span>

              <h2>
                {mode === "login"
                  ? "Sign in to your account"
                  : "Create your account"}
              </h2>

              <p>
                {mode === "login"
                  ? "Continue where you left off."
                  : "Start building your smarter job-search workflow."}
              </p>
            </div>

            <div className="auth-mode-switch">
              <button
                type="button"
                className={
                  mode === "login"
                    ? "auth-mode auth-mode-active"
                    : "auth-mode"
                }
                onClick={() =>
                  switchMode("login")
                }
              >
                Sign in
              </button>

              <button
                type="button"
                className={
                  mode === "register"
                    ? "auth-mode auth-mode-active"
                    : "auth-mode"
                }
                onClick={() =>
                  switchMode("register")
                }
              >
                Create account
              </button>
            </div>

            <form
              className="auth-form-modern"
              onSubmit={submit}
            >
              {mode === "register" && (
                <div className="auth-field">
                  <label htmlFor="name">
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  {mode === "login" && (
                    <span>
                      Secure login
                    </span>
                  )}
                </div>

                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "🙈"
                      : "👁️"}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="avatar-section">
                  <div className="avatar-section-header">
                    <div>
                      <strong>
                        Choose your avatar
                      </strong>

                      <span>
                        You can change this later.
                      </span>
                    </div>
                  </div>

                  <div className="avatar-options">
                    {(
                      [
                        {
                          value:
                            "female" as AvatarStyle,
                          label: "Friendly",
                        },
                        {
                          value:
                            "male" as AvatarStyle,
                          label: "Professional",
                        },
                        {
                          value:
                            "neutral" as AvatarStyle,
                          label: "Classic",
                        },
                      ]
                    ).map(
                      (option) => {
                        const selected =
                          avatarStyle ===
                          option.value;

                        return (
                          <button
                            type="button"
                            key={
                              option.value
                            }
                            className={
                              selected
                                ? "avatar-option avatar-option-active"
                                : "avatar-option"
                            }
                            onClick={() =>
                              setAvatarStyle(
                                option.value
                              )
                            }
                          >
                            <Avatar
                              style={
                                option.value
                              }
                              size={54}
                            />

                            <span>
                              {option.label}
                            </span>

                            {selected && (
                              <span className="avatar-check">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="auth-error">
                  <span>
                    !
                  </span>

                  <p>
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" />

                    {mode === "login"
                      ? "Signing in..."
                      : "Creating account..."}
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Sign in"
                      : "Create account"}

                    <span>
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-switch">
              {mode === "login" ? (
                <>
                  <span>
                    Don't have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      switchMode(
                        "register"
                      )
                    }
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Already have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      switchMode("login")
                    }
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            <div className="auth-trust">
              <span>
                🔒
              </span>

              <span>
                Your account information
                is securely stored.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}