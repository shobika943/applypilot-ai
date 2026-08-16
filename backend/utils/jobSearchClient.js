// Live job search via the Adzuna API (https://developer.adzuna.com/ - free tier).
// Adzuna aggregates listings from LinkedIn, Naukri, Indeed, company career
// pages, etc. and gives us a `redirect_url` that sends the user to the
// original posting to actually apply — which is exactly what we want.
import axios from "axios";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

// datePosted filter -> Adzuna's max_days_old param ("any" omits the param entirely)
const MAX_DAYS_OLD = { "24h": 1, "3d": 3, "1w": 7, "1m": 30 };

export async function searchJobs({ query, location, datePosted = "1w", page = 1, resultsPerPage = 50 }) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || "in"; // "in" = India, "us", "gb", etc.

  if (!appId || !appKey) {
    throw new Error(
      "ADZUNA_APP_ID / ADZUNA_APP_KEY are not set. Register free at https://developer.adzuna.com/ and add them to backend/.env"
    );
  }

  const maxDaysOld = MAX_DAYS_OLD[datePosted]; // undefined for "any" -> Adzuna returns all ages

  const { data } = await axios.get(`${ADZUNA_BASE}/${country}/search/${page}`, {
    params: {
      app_id: appId,
      app_key: appKey,
      what: query,
      where: location || undefined,
      max_days_old: maxDaysOld,
      results_per_page: resultsPerPage,
      sort_by: "date",
      "content-type": "application/json",
    },
  });

  return (data.results || []).map((r) => ({
    externalId: String(r.id),
    title: (r.title || "").replace(/<[^>]+>/g, ""),
    company: r.company?.display_name || "Unknown Company",
    description: r.description || "",
    location: r.location?.display_name || "",
    // NOTE: this is Adzuna's own tracked redirect URL. Adzuna resolves it to
    // the real listing on click, but we cannot claim in advance which site
    // (employer / LinkedIn / Naukri) it lands on — hence "Unconfirmed".
    redirectUrl: r.redirect_url,
    sourcePlatform: "Unconfirmed",
    postedAt: r.created ? new Date(r.created) : null,
    salaryMin: r.salary_min || null,
    salaryMax: r.salary_max || null,
    source: "adzuna",
  }));
}
