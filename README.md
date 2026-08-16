# ApplyPilot AI

AI-powered job matching, interview preparation, and mock-interview platform.

Full flow implemented:

```
Upload Resume (once)
   -> Resume profile built (skills extracted)
   -> Live jobs fetched (filterable: Any time / 24h / 3 days / 7 days / 30 days, + location)
   -> Dedupe -> keyword shortlist -> ONE batched AI relevance-ranking call
      (not one AI call per job — keeps it fast and cheap)
   -> Click "Apply on original listing" -> opens externally, recorded as "saved"
   -> Back in ApplyPilot: "Did you apply?" -> only "Yes" marks it "Applied"
      (a click alone never counts — we can't know the external form was submitted)
   -> Generate Interview Prep Guide (50-100 Q&A, categorized, prioritized)
   -> Start Mock Interview (AI asks, you answer, AI scores + gives feedback)
   -> Final Interview Report (overall/technical/communication scores, weak/strong topics)
```

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Anthropic API for all AI features
- **Frontend:** React + TypeScript + Vite

## Project structure

```
applypilot-ai/
  backend/
    server.js            entrypoint
    config/db.js          MongoDB connection
    models/                User, Job, Application, InterviewGuide, MockInterview
    routes/                 auth, resume, jobs, match, interview, mockInterview
    middleware/auth.js     JWT auth guard
    utils/aiClient.js      Anthropic API wrapper (callClaude / callClaudeJSON)
  frontend/
    src/pages/              Login, ResumeUpload, Jobs, JobDetail, InterviewPrep,
                            MockInterview, Report
    src/api/client.ts       fetch wrapper for the backend API
```

## Job search

Live job discovery uses the **Adzuna API** (free tier — aggregates listings from
LinkedIn, Naukri, Indeed, company career pages, etc.). Register free at
https://developer.adzuna.com/ and put your `app_id` / `app_key` in `backend/.env`.

**A precise note on the "Apply" link:** Adzuna's `redirect_url` is Adzuna's own
tracked redirect — it resolves to the real listing when clicked, but the API
doesn't guarantee in advance which site (employer career page / LinkedIn /
Naukri) it lands on. The app stores this as `redirectUrl` with
`sourcePlatform: "Unconfirmed"` and the UI says **"Apply on original listing"**,
not "Apply on LinkedIn" or similar — don't overclaim what the data actually tells you.

**Search pipeline** (`GET /api/jobs/search`), designed to avoid AI calls on
every single fetched job:
1. Fetch up to 50 raw results from Adzuna (already date + location filtered)
2. Dedupe by title+company
3. Cheap keyword-overlap scoring against the resume's skills (no AI) → top 25
4. **One** batched AI call ranks those 25 for relevance → top 12 returned
5. Saved to the database so job detail / prep / mock interview work identically
   however the listing was sourced

**Application status is honest, not optimistic:**
- `matched` — seen, not yet applied
- `saved` — user clicked Apply and was redirected out, but hasn't confirmed
- `applied` — user came back and confirmed "Yes, I applied" — only this state
  unlocks interview prep, since prep is tied to a real, confirmed application

Manual "Add Job" is still available as a fallback for pasting a listing the
search didn't surface. Want a different job source (LinkedIn's own API,
Naukri, a company ATS)? The fetch logic is isolated in
`backend/utils/jobSearchClient.js` — every route that calls it stays the same.
Relying on Adzuna alone is fine for a portfolio MVP; a production version
would add more sources.

## What's fully implemented vs. what needs your own keys

- **Fully implemented (real AI calls):** skill extraction from resume, match score
  + skill-gap analysis, 50-100 question interview guide generation, mock-interview
  answer evaluation, final report generation.
- **Needs your own free API keys to go live:** Adzuna (job search) and Anthropic
  (all the AI features) — both have `.env` placeholders, see setup below.

See the step-by-step setup below.
