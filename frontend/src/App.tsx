import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import Login from "./pages/Login";
import ResumeUpload from "./pages/ResumeUpload";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import InterviewPrep from "./pages/InterviewPrep";
import MockInterview from "./pages/MockInterview";
import Report from "./pages/Report";

import Profile from "./pages/Profile";
import ApplicationsPage from "./pages/Applications";
import AddJob from "./pages/AddJob";

import Avatar, {
  AvatarStyle,
} from "./components/Avatar";

import Logo from "./components/Logo";

/* =========================================================
   AUTH
   ========================================================= */

function isAuthed(): boolean {
  return Boolean(
    localStorage.getItem("token")
  );
}

function getStoredUser() {
  try {
    const raw =
      localStorage.getItem("user");

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* =========================================================
   NAVIGATION CONFIG
   ========================================================= */

const navigation = [
  {
    path: "/resume",
    label: "Resume Match",
    shortLabel: "Resume",
    icon: "🎯",
  },
  {
    path: "/jobs",
    label: "Job Search",
    shortLabel: "Jobs",
    icon: "🔎",
  },
  {
    path: "/add-job",
    label: "Add Job",
    shortLabel: "Add",
    icon: "➕",
  },
  {
    path: "/applications",
    label: "Applications",
    shortLabel: "Apps",
    icon: "📋",
  },
  {
    path: "/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: "👤",
  },
];

/* =========================================================
   DESKTOP + MOBILE NAVIGATION
   ========================================================= */

function AppNavigation() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [user, setUser] =
    useState<any>(
      getStoredUser()
    );

  useEffect(() => {
    setUser(
      getStoredUser()
    );
  }, [location.pathname]);

  function logout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href =
      "/login";
  }

  return (
    <>
      {/* ===================================================
          DESKTOP HEADER
          =================================================== */}

      <header className="app-header">
        <div className="header-inner">

          {/* BRAND */}

          <NavLink
            to="/jobs"
            className="brand"
          >
            <span className="brand-logo">
              <Logo size={32} />
            </span>

            <span>
              <strong>
                ApplyPilot
              </strong>

              <small>
                AI
              </small>
            </span>
          </NavLink>

          {/* DESKTOP NAV */}

          <nav className="desktop-nav">
            {navigation.map(
              (item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${
                      isActive
                        ? "nav-item-active"
                        : ""
                    }`
                  }
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              )
            )}
          </nav>

          {/* USER */}

          <div className="user-menu">
            <button
              type="button"
              className="profile-button"
              onClick={() =>
                navigate("/profile")
              }
            >
              <Avatar
                style={
                  (user?.avatarStyle ||
                    "neutral") as AvatarStyle
                }
                size={40}
              />

              <span className="profile-text">
                <strong>
                  {user?.name || "User"}
                </strong>

                <small>
                  View profile
                </small>
              </span>

              <span className="profile-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================
          MOBILE BOTTOM TAB BAR
          =================================================== */}

      <nav className="mobile-tab-bar">
        {navigation.map(
          (item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-tab ${
                  isActive
                    ? "mobile-tab-active"
                    : ""
                }`
              }
            >
              <span className="mobile-tab-icon">
                {item.icon}
              </span>

              <span>
                {item.shortLabel}
              </span>
            </NavLink>
          )
        )}
      </nav>
    </>
  );
}

/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAuthed()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const authed =
    isAuthed();

  return (
    <div className="app-shell">
      {/* NAVIGATION */}

      {authed && (
        <AppNavigation />
      )}

      {/* PAGE CONTENT */}

      <main
        className={
          authed
            ? "app-main"
            : "public-main"
        }
      >
        <Routes>

          {/* =================================================
              LOGIN
              ================================================= */}

          <Route
            path="/login"
            element={
              authed ? (
                <Navigate
                  to="/jobs"
                  replace
                />
              ) : (
                <Login />
              )
            }
          />

          {/* =================================================
              RESUME MATCH
              ================================================= */}

          <Route
            path="/resume"
            element={
              <ProtectedPage>
                <ResumeUpload />
              </ProtectedPage>
            }
          />

          {/* =================================================
              JOB SEARCH
              ================================================= */}

          <Route
            path="/jobs"
            element={
              <ProtectedPage>
                <Jobs />
              </ProtectedPage>
            }
          />

          {/* =================================================
              JOB DETAIL
              ================================================= */}

          <Route
            path="/jobs/:id"
            element={
              <ProtectedPage>
                <JobDetail />
              </ProtectedPage>
            }
          />

          {/* =================================================
              ADD JOB
              ================================================= */}

          <Route
            path="/add-job"
            element={
              <ProtectedPage>
                <AddJob />
              </ProtectedPage>
            }
          />

          {/* =================================================
              APPLICATIONS
              ================================================= */}

          <Route
            path="/applications"
            element={
              <ProtectedPage>
                <ApplicationsPage />
              </ProtectedPage>
            }
          />

          {/* =================================================
              INTERVIEW PREPARATION
              ================================================= */}

          <Route
            path="/applications/:applicationId/prep"
            element={
              <ProtectedPage>
                <InterviewPrep />
              </ProtectedPage>
            }
          />

          {/* =================================================
              MOCK INTERVIEW
              ================================================= */}

          <Route
            path="/mock-interview/:guideId"
            element={
              <ProtectedPage>
                <MockInterview />
              </ProtectedPage>
            }
          />

          {/* =================================================
              MOCK INTERVIEW REPORT
              ================================================= */}

          <Route
            path="/mock-interview/:mockId/report"
            element={
              <ProtectedPage>
                <Report />
              </ProtectedPage>
            }
          />

          {/* =================================================
              PROFILE
              ================================================= */}

          <Route
            path="/profile"
            element={
              <ProtectedPage>
                <Profile />
              </ProtectedPage>
            }
          />

          {/* =================================================
              DEFAULT
              ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to={
                  isAuthed()
                    ? "/jobs"
                    : "/login"
                }
                replace
              />
            }
          />

        </Routes>
      </main>
    </div>
  );
}