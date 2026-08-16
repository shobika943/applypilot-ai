# ApplyPilot AI — Full Setup & Execution Guide

One guide, start to finish: install, configure, run, and use the app.

---

## Part 1 — Prerequisites

Install these before anything else:

| Tool | Check you have it | Get it |
|---|---|---|
| Node.js (v18+) | `node -v` | https://nodejs.org |
| npm (comes with Node) | `npm -v` | — |
| MongoDB (local or Atlas) | — | https://www.mongodb.com/cloud/atlas (free tier is fine) |
| A code editor | — | VS Code recommended |

You'll also need two free API keys (both take a few minutes to get — instructions below):
- **Anthropic API key** — powers all the AI features (skill extraction, match scoring, question generation, mock-interview evaluation)
- **Adzuna API key** — powers live job search

---

## Part 2 — Get your API keys

### 2a. Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Go to **Settings → API Keys → Create Key**
4. Copy the key (starts with `sk-ant-...`) — you won't be able to see it again, so paste it somewhere safe for now

### 2b. Adzuna API key
1. Go to https://developer.adzuna.com/
2. Click **Register** and create a free account
3. Once logged in, go to your **Dashboard** — you'll see an `App ID` and `App Key`
4. Copy both

### 2c. MongoDB connection string
- **Option A (cloud, easiest):** On MongoDB Atlas, create a free cluster → Database Access (create a user + password) → Network Access (allow your IP, or `0.0.0.0/0` for simplicity during development) → Connect → "Drivers" → copy the connection string. It looks like:
  `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/applypilot`
- **Option B (local):** If MongoDB is installed locally, your connection string is simply:
  `mongodb://127.0.0.1:27017/applypilot`

---

## Part 3 — Unzip and configure the backend

```bash
unzip applypilot-ai.zip
cd applypilot-ai/backend
cp .env.example .env
```

Open `.env` in your editor and fill in the values you collected in Part 2:

```
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string — e.g. mash your keyboard>
ANTHROPIC_API_KEY=<your Anthropic key>
ANTHROPIC_MODEL=claude-sonnet-4-6

ADZUNA_APP_ID=<your Adzuna app id>
ADZUNA_APP_KEY=<your Adzuna app key>
ADZUNA_COUNTRY=in
```

> `ADZUNA_COUNTRY` controls which country's job listings you search. Use `in` for India, `us` for the US, `gb` for the UK, etc. (Adzuna supports most major countries — see their docs if unsure.)

Install dependencies and start the backend:

```bash
npm install
npm run dev
```

You should see:
```
MongoDB connected: ...
ApplyPilot AI backend running on port 5000
```

Leave this terminal running. Quick sanity check — open `http://localhost:5000/api/health` in a browser; it should return `{"status":"ok"}`.

---

## Part 4 — Set up and start the frontend

Open a **second terminal**:

```bash
cd applypilot-ai/frontend
npm install
npm run dev
```

You'll see something like:
```
  VITE ready
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

---

## Part 5 — Walk through the app

**1. Create an account**
On the login screen, click "Need an account? Register" and sign up.

**2. Upload your resume**
Go to the **Resume** tab → upload a PDF (or plain `.txt`) resume → wait a few seconds while it's analyzed. You'll see your extracted skills appear as chips.

**3. Browse matched jobs**
Go to **Jobs**. It automatically searches for live jobs relevant to your resume as soon as you land on the page.
- Use the filter chips: **Any time / Last 24 hours / Last 3 days / Last 7 days / Last 30 days**
- Optionally type a location (e.g. "Chennai", "Remote") and hit **Search**
- Each job card shows a relevance score and a one-line reason from the AI ranking

**4. Apply**
Click **"Apply on original listing"** on any job. This opens the listing in a new tab where you actually apply. Back in ApplyPilot, you'll be asked:

> Did you complete the application?
> ✅ Yes, I applied &nbsp;&nbsp; Not yet

Click **"Yes, I applied"** only after you've actually submitted the application externally. This is what unlocks the next step — clicking "Not yet" just leaves it saved for later.

**5. Prepare for interview**
Once confirmed applied, click **"Prepare for Interview"** on that job → **"Generate Interview Prep Guide."** This takes 20–40 seconds — it's generating 50–100 JD-and-resume-specific questions with full answers, categorized (Technical / Project-Based / Scenario-Based / HR-Behavioral / Skill-Gap) and bucketed (Must Prepare / Should Prepare / Additional Preparation).

**6. Mock interview**
From the prep guide screen, click **"Start Mock Interview."** Answer each question in the text box and submit — the AI scores it out of 10, shows what you got right, what you missed, a stronger version of your answer, and a natural follow-up question.

**7. Final report**
After the last question, you're taken to a report with overall/technical/communication scores, your strong and weak topics, and what to study next.

---

## Part 6 — Common issues

| Problem | Likely cause / fix |
|---|---|
| Backend won't start: `MongoDB connection error` | Check `MONGO_URI` in `.env`. For Atlas, confirm your IP is allowed under Network Access. |
| `/jobs/search` returns an error about `ADZUNA_APP_ID` | You haven't filled in the Adzuna keys in `backend/.env`, or the backend wasn't restarted after editing `.env`. |
| AI features fail (resume analysis, match score, etc.) | Check `ANTHROPIC_API_KEY` in `.env` is correct and has available credits. |
| Frontend loads but API calls 404 | Make sure the backend is running on port 5000 — the frontend's Vite dev server proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.ts`). |
| No jobs show up for a search | Try a wider date filter ("Any time") or clear the location field — Adzuna's coverage varies by region and role. You can always add a job manually via "+ Add manually." |
| Changed `.env` but nothing changed | Restart the backend (`Ctrl+C` then `npm run dev` again) — `.env` is only read on startup. |

---

## Part 7 — Deploying it beyond localhost (optional, later)

This guide covers running it locally. To make it live for others:
- **Backend:** deploy to something like Render, Railway, or Fly.io; set the same environment variables there.
- **Frontend:** `npm run build` in `frontend/`, then deploy the `dist/` folder to Vercel, Netlify, or similar. Update the API base URL (currently a relative `/api` path proxied by Vite locally) to point at your deployed backend.
- **MongoDB:** use an Atlas cluster (not local) so the deployed backend can reach it.

That's the full loop — resume in, ranked live jobs out, honest applied-tracking, AI-generated prep, and a scored mock interview.
