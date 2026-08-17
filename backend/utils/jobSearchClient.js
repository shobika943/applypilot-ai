// =============================================================
// ApplyPilot AI - Live Job Search
// Provider: Adzuna API
//
// Required Render/backend environment variables:
//
// ADZUNA_APP_ID
// ADZUNA_APP_KEY
// ADZUNA_COUNTRY
//
// Example:
// ADZUNA_COUNTRY=in
// =============================================================

import axios from "axios";

const ADZUNA_BASE_URL =
  "https://api.adzuna.com/v1/api/jobs";

/* ============================================================
   DATE FILTERS
   ============================================================ */

const MAX_DAYS_OLD = {
  "24h": 1,
  "3d": 3,
  "1w": 7,
  "1m": 30,
};

/* ============================================================
   CONFIG
   ============================================================ */

function getConfig() {
  const appId =
    process.env.ADZUNA_APP_ID?.trim();

  const appKey =
    process.env.ADZUNA_APP_KEY?.trim();

  const country =
    (
      process.env.ADZUNA_COUNTRY ||
      "in"
    )
      .trim()
      .toLowerCase();

  if (!appId) {
    throw new Error(
      "ADZUNA_APP_ID is not configured."
    );
  }

  if (!appKey) {
    throw new Error(
      "ADZUNA_APP_KEY is not configured."
    );
  }

  return {
    appId,
    appKey,
    country,
  };
}

/* ============================================================
   REMOVE HTML
   ============================================================ */

function stripHtml(
  value = ""
) {
  return String(value)
    .replace(
      /<[^>]*>/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* ============================================================
   SEARCH JOBS
   ============================================================ */

export async function searchJobs({
  query = "",
  location = "",
  datePosted = "1w",
  page = 1,
  resultsPerPage = 20,
}) {
  const {
    appId,
    appKey,
    country,
  } = getConfig();

  const normalizedQuery =
    String(query)
      .trim();

  const normalizedLocation =
    String(location)
      .trim();

  const maxDaysOld =
    MAX_DAYS_OLD[
      datePosted
    ];

  const url =
    `${ADZUNA_BASE_URL}/${country}/search/${page}`;

  /* ==========================================================
     REQUEST PARAMETERS
     ========================================================== */

  const params = {
    app_id:
      appId,

    app_key:
      appKey,

    results_per_page:
      Math.min(
        Number(
          resultsPerPage
        ) || 20,
        20
      ),

    sort_by:
      "date",

    "content-type":
      "application/json",
  };

  /*
   * Add keyword only when available.
   */
  if (normalizedQuery) {
    params.what =
      normalizedQuery;
  }

  /*
   * Add location only when available.
   */
  if (normalizedLocation) {
    params.where =
      normalizedLocation;
  }

  /*
   * Add date filter only when
   * the user selected one.
   */
  if (
    typeof maxDaysOld ===
    "number"
  ) {
    params.max_days_old =
      maxDaysOld;
  }

  /* ==========================================================
     LOG SEARCH
     ========================================================== */

  console.log(
    "\n========== ADZUNA SEARCH =========="
  );

  console.log(
    "Country:",
    country
  );

  console.log(
    "Query:",
    normalizedQuery ||
      "Any job"
  );

  console.log(
    "Location:",
    normalizedLocation ||
      "Any"
  );

  console.log(
    "Date:",
    datePosted
  );

  console.log(
    "Page:",
    page
  );

  console.log(
    "===================================\n"
  );

  /* ==========================================================
     API REQUEST
     ========================================================== */

  try {
    const response =
      await axios.get(
        url,
        {
          params,

          headers: {
            Accept:
              "application/json",
          },

          timeout:
            20000,
        }
      );

    const data =
      response?.data ||
      {};

    const results =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    console.log(
      "Adzuna status:",
      response.status
    );

    console.log(
      "Adzuna jobs returned:",
      results.length
    );

    /* ========================================================
       NORMALIZE RESULTS
       ======================================================== */

    const jobs =
      results
        .map(
          (job) => {
            const externalId =
              job?.id != null
                ? String(
                    job.id
                  )
                : "";

            const title =
              stripHtml(
                job?.title ||
                  ""
              );

            const company =
              stripHtml(
                job?.company
                  ?.display_name ||
                  "Unknown Company"
              );

            const description =
              stripHtml(
                job?.description ||
                  ""
              );

            const locationName =
              stripHtml(
                job?.location
                  ?.display_name ||
                  ""
              );

            const redirectUrl =
              job?.redirect_url ||
              "";

            let postedAt =
              null;

            if (
              job?.created
            ) {
              const date =
                new Date(
                  job.created
                );

              if (
                !Number.isNaN(
                  date.getTime()
                )
              ) {
                postedAt =
                  date;
              }
            }

            return {
              externalId,

              title,

              company,

              description,

              location:
                locationName,

              redirectUrl,

              sourcePlatform:
                "Adzuna",

              postedAt,

              salaryMin:
                typeof job?.salary_min ===
                "number"
                  ? job.salary_min
                  : null,

              salaryMax:
                typeof job?.salary_max ===
                "number"
                  ? job.salary_max
                  : null,

              source:
                "adzuna",
            };
          }
        )
        .filter(
          (job) =>
            job.title &&
            job.redirectUrl
        );

    console.log(
      "Normalized jobs:",
      jobs.length
    );

    return jobs;
  } catch (
    error
  ) {
    console.error(
      "\n========== ADZUNA ERROR =========="
    );

    if (
      error?.response
    ) {
      console.error(
        "HTTP Status:",
        error.response.status
      );

      console.error(
        "URL:",
        url
      );

      console.error(
        "Response:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(
        "Error Code:",
        error?.code
      );

      console.error(
        "Error Message:",
        error?.message
      );
    }

    console.error(
      "==================================\n"
    );

    /*
     * IMPORTANT:
     * Throw the real error instead of
     * silently returning [].
     */
    const message =
      error?.response
        ?.data?.error ||
      error?.response
        ?.data?.message ||
      error?.message ||
      "Adzuna job search failed.";

    throw new Error(
      `Adzuna search failed: ${message}`
    );
  }
}