import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resume.js";
import jobRoutes from "./routes/jobs.js";
import matchRoutes from "./routes/match.js";
import interviewRoutes from "./routes/interview.js";
import mockInterviewRoutes from "./routes/mockInterview.js";
import profileRoutes from "./routes/profile.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      service: "ApplyPilot AI",
    });
  }
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/resume",
  resumeRoutes
);

app.use(
  "/api/jobs",
  jobRoutes
);

app.use(
  "/api/match",
  matchRoutes
);

app.use(
  "/api/interview",
  interviewRoutes
);

app.use(
  "/api/mock-interview",
  mockInterviewRoutes
);

app.use(
  "/api/profile",
  profileRoutes
);

// Global error handler
app.use(
  (err, req, res, next) => {
    console.error(
      "Unhandled server error:",
      err
    );

    if (res.headersSent) {
      return next(err);
    }

    res.status(
      err.status || 500
    ).json({
      error:
        err.message ||
        "Internal server error",
    });
  }
);

const PORT =
  process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(
      PORT,
      () => {
        console.log(
          `ApplyPilot AI backend running on port ${PORT}`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      "Failed to start backend:",
      err
    );

    process.exit(1);
  });