// ApplyPilot AI - Job Discovery Routes

import { Router } from "express";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { searchJobs } from "../utils/jobSearchClient.js";
import { callClaudeJSON } from "../utils/aiClient.js";

const router = Router();

// =============================================================
// HELPERS
// =============================================================

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim();
}

function parseList(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/*
  Convert work type into search keywords.
*/
function getWorkTypeKeywords(workType) {
  const types = parseList(workType);

  if (types.length === 0) {
    return [];
  }

  const keywords = [];

  for (const type of types) {
    const normalized = normalize(type);

    if (normalized === "remote") {
      keywords.push("remote");
    }

    if (normalized === "hybrid") {
      keywords.push("hybrid");
    }

    if (
      normalized === "onsite" ||
      normalized === "on-site" ||
      normalized === "on site"
    ) {
      keywords.push("on-site");
    }
  }

  return keywords;
}

/*
  Experience filtering is partly done locally because external
  job providers do not always expose a structured experience field.

  We detect common phrases from the title/description.
*/
function matchesExperience(job, experience) {
  if (!experience || experience === "any") {
    return true;
  }

  const text = normalize(
    `${job.title || ""} ${job.description || ""}`
  );

  // Fresher / entry-level
  if (
    experience === "fresher" ||
    experience === "0-1"
  ) {
    return (
      /fresher|freshers|entry[- ]level|0[- ]?1\s*year|0\s*years?|graduates?|junior/i.test(
        text
      ) ||
      !/\d+\+?\s*years?/i.test(text)
    );
  }

  // 1-2 years
  if (experience === "1-2") {
    return (
      /1[- ]?2\s*years?/i.test(text) ||
      /1\s*year/i.test(text) ||
      /2\s*years?/i.test(text)
    );
  }

  // 2-3 years
  if (experience === "2-3") {
    return (
      /2[- ]?3\s*years?/i.test(text) ||
      /2\s*years?/i.test(text) ||
      /3\s*years?/i.test(text)
    );
  }

  // 3-5 years
  if (experience === "3-5") {
    return (
      /3[- ]?5\s*years?/i.test(text) ||
      /3\s*years?/i.test(text) ||
      /4\s*years?/i.test(text) ||
      /5\s*years?/i.test(text)
    );
  }

  return true;
}

/*
  Work type filtering.
  We deliberately keep this flexible because some job providers
  don't give structured work-type fields.
*/
function matchesWorkType(job, workType) {
  const types = parseList(workType);

  if (types.length === 0) {
    return true;
  }

  const text = normalize(
    `${job.title || ""} ${job.description || ""} ${job.location || ""}`
  );

  return types.some((type) => {
    const normalized = normalize(type);

    if (normalized === "remote") {
      return /remote|work from home|wfh/i.test(text);
    }

    if (normalized === "hybrid") {
      return /hybrid/i.test(text);
    }

    if (
      normalized === "onsite" ||
      normalized === "on-site" ||
      normalized === "on site"
    ) {
      return (
        /on[- ]site|office[- ]based|office based/i.test(text)
      );
    }

    return true;
  });
}

/*
  Apply simple keyword scoring for normal search.
*/
function calculateNormalSearchScore(job, searchTerms) {
  if (searchTerms.length === 0) {
    return 0;
  }

  const title = normalize(job.title);
  const description = normalize(job.description);

  let score = 0;

  for (const term of searchTerms) {
    const keyword = normalize(term);

    if (!keyword) {
      continue;
    }

    if (title.includes(keyword)) {
      score += 20;
    }

    if (description.includes(keyword)) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

// =============================================================
// GET /api/jobs/search
// =============================================================

router.get(
  "/search",
  requireAuth,
  async (req, res) => {
    try {
      // ---------------------------------------------------------
      // 1. LOAD USER
      // ---------------------------------------------------------

      const user =
        await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      // ---------------------------------------------------------
      // 2. READ SEARCH OPTIONS
      // ---------------------------------------------------------

      const mode =
        String(
          req.query.mode || "normal"
        ).toLowerCase();

      const datePosted =
        String(
          req.query.datePosted || "1w"
        );

      const page =
        parseInt(
          req.query.page,
          10
        ) || 1;

      const query =
        String(
          req.query.query || ""
        ).trim();

      const role =
        String(
          req.query.role || ""
        ).trim();

      const experience =
        String(
          req.query.experience || "any"
        ).trim();

      const workType =
        String(
          req.query.workType || ""
        ).trim();

      const locations =
        parseList(
          req.query.location || ""
        );

      // ---------------------------------------------------------
      // 3. VALIDATE MODE
      // ---------------------------------------------------------

      const allowedModes = [
        "normal",
        "resume",
        "manual",
      ];

      if (!allowedModes.includes(mode)) {
        return res.status(400).json({
          error:
            "Invalid search mode. Use normal, resume, or manual.",
        });
      }

      // ---------------------------------------------------------
      // 4. MANUAL JOB MODE
      // ---------------------------------------------------------

      if (mode === "manual") {
        const manualJobs =
          await Job.find({
            createdBy: req.userId,
            source: "manual",
          }).sort({
            createdAt: -1,
          });

        return res.json({
          mode: "manual",
          fetchedCount:
            manualJobs.length,
          recommendedCount:
            manualJobs.length,
          jobs: manualJobs,
        });
      }

      // ---------------------------------------------------------
      // 5. RESUME MODE
      // ---------------------------------------------------------

      const resumeSkills =
        (
          user.resumeSkills ||
          []
        )
          .map((skill) =>
            String(skill).trim()
          )
          .filter(Boolean);

      const normalizedSkills =
        resumeSkills.map(
          (skill) =>
            skill.toLowerCase()
        );

      if (
        mode === "resume" &&
        !user.resumeText
      ) {
        return res.status(400).json({
          error:
            "Resume Match requires a resume. Upload your resume first or switch to Normal Search.",
        });
      }

      // ---------------------------------------------------------
      // 6. BUILD SEARCH QUERIES
      // ---------------------------------------------------------

      let searchQueries = [];

      /*
        NORMAL SEARCH:
        Use exactly what the user requested.
      */
      if (mode === "normal") {
        if (role) {
          searchQueries.push(role);
        }

        if (query) {
          searchQueries.push(query);
        }

        /*
          If the user chooses no role/query at all,
          give them a sensible broad software search.
        */
        if (searchQueries.length === 0) {
          searchQueries.push(
            "Software Developer"
          );
        }
      }

      /*
        RESUME SEARCH:
        We deliberately use only a small number of broad roles
        to reduce external API calls and 429 rate limits.
      */
      if (mode === "resume") {
        if (role) {
          searchQueries.push(role);
        } else {
          searchQueries.push(
            "Full Stack Developer",
            "React Developer",
            "Node.js Developer",
            "Software Developer"
          );

          // Only add role-specific searches when relevant.
          if (
            normalizedSkills.some(
              (skill) =>
                skill.includes(".net") ||
                skill.includes("asp.net") ||
                skill === "c#"
            )
          ) {
            searchQueries.push(
              "ASP.NET Developer"
            );
          }

          if (
            normalizedSkills.some(
              (skill) =>
                skill.includes("python")
            )
          ) {
            searchQueries.push(
              "Python Developer"
            );
          }
        }

        /*
          If the user also typed a keyword,
          include it as an additional targeted search.
        */
        if (query) {
          searchQueries.push(query);
        }
      }

      // Remove duplicates.
      searchQueries = [
        ...new Set(
          searchQueries.filter(Boolean)
        ),
      ];

      /*
        Keep external search requests under control.
        This prevents a single UI action from firing
        many provider requests.
      */
      searchQueries =
        searchQueries.slice(0, 5);

      console.log(
        "----------------------------------------"
      );

      console.log(
        "ApplyPilot Job Search"
      );

      console.log(
        "Mode:",
        mode
      );

      console.log(
        "Query:",
        query || "None"
      );

      console.log(
        "Role:",
        role || "Any"
      );

      console.log(
        "Experience:",
        experience
      );

      console.log(
        "Work type:",
        workType || "Any"
      );

      console.log(
        "Location:",
        locations.length > 0
          ? locations.join(", ")
          : "Any"
      );

      console.log(
        "Date filter:",
        datePosted
      );

      console.log(
        "Search queries:",
        searchQueries
      );

      console.log(
        "----------------------------------------"
      );

      // ---------------------------------------------------------
      // 7. SEARCH EACH LOCATION
      // ---------------------------------------------------------

      /*
        Empty locations = provider decides / all locations.

        Multiple locations are searched individually because
        the current job-search helper accepts one location.
      */

      const locationList =
        locations.length > 0
          ? locations
          : [""];

      const searchTasks = [];

      for (
        const selectedLocation of locationList
      ) {
        for (
          const searchQuery of searchQueries
        ) {
          searchTasks.push(
            {
              location:
                selectedLocation,
              query:
                searchQuery,
            }
          );
        }
      }

      /*
        Limit concurrent provider requests.
        This is intentionally much smaller than blindly
        firing every possible request together.
      */

      const limitedTasks =
        searchTasks.slice(
          0,
          8
        );

      const searchResults =
        await Promise.all(
          limitedTasks.map(
            async ({
              location,
              query: searchQuery,
            }) => {
              try {
                console.log(
                  `Searching Adzuna: "${searchQuery}" | Location: ${
                    location || "Any"
                  } | Date: ${datePosted}`
                );

                const jobs =
                  await searchJobs({
                    query:
                      searchQuery,
                    location,
                    datePosted,
                    page,
                    resultsPerPage:
                      20,
                  });

                console.log(
                  `"${searchQuery}" [${
                    location || "Any"
                  }] returned ${
                    jobs.length
                  } jobs`
                );

                return jobs;
              } catch (error) {
                console.error(
                  `Search failed for "${searchQuery}" [${
                    location ||
                    "Any"
                  }]:`,
                  error.message
                );

                return [];
              }
            }
          )
        );

      // ---------------------------------------------------------
      // 8. FLATTEN
      // ---------------------------------------------------------

      const raw =
        searchResults.flat();

      console.log(
        "Total raw jobs:",
        raw.length
      );

      // ---------------------------------------------------------
      // 9. NOTHING FOUND
      // ---------------------------------------------------------

      if (raw.length === 0) {
        return res.json({
          mode,
          query,
          role,
          experience,
          workType,
          locations,
          datePosted,
          fetchedCount: 0,
          dedupedCount: 0,
          shortlistedCount: 0,
          recommendedCount: 0,
          jobs: [],
          message:
            "No jobs were returned for the selected search criteria.",
        });
      }

      // ---------------------------------------------------------
      // 10. DEDUPLICATE
      // ---------------------------------------------------------

      const seen =
        new Set();

      const deduped =
        raw.filter(
          (job) => {
            const title =
              normalize(
                job.title
              );

            const company =
              normalize(
                job.company
              );

            const locationText =
              normalize(
                job.location
              );

            const externalId =
              String(
                job.externalId ||
                  ""
              ).trim();

            const key =
              externalId
                ? `${
                    job.source ||
                    "unknown"
                  }::${externalId}`
                : `${title}::${company}::${locationText}`;

            if (
              seen.has(key)
            ) {
              return false;
            }

            seen.add(key);

            return true;
          }
        );

      console.log(
        "After deduplication:",
        deduped.length
      );

      // ---------------------------------------------------------
      // 11. APPLY LOCAL FILTERS
      // ---------------------------------------------------------

      let filtered =
        deduped.filter(
          (job) =>
            matchesExperience(
              job,
              experience
            ) &&
            matchesWorkType(
              job,
              workType
            )
        );

      /*
        If strict local filtering removes everything,
        don't show a blank page for a reasonable search.
        In that case return the provider results rather than
        pretending that no jobs exist.
      */
      if (
        filtered.length === 0 &&
        deduped.length > 0
      ) {
        filtered =
          deduped;
      }

      // ---------------------------------------------------------
      // 12. NORMAL SEARCH
      // ---------------------------------------------------------

      if (mode === "normal") {
        const searchTerms = [
          role,
          ...parseList(query),
        ].filter(Boolean);

        const normalScored =
          filtered.map(
            (job) => ({
              ...job,

              relevanceScore:
                calculateNormalSearchScore(
                  job,
                  searchTerms
                ),

              relevanceReason:
                searchTerms.length > 0
                  ? `Matches your search: ${searchTerms.join(
                      ", "
                    )}`
                  : "General software-development job search result.",
            })
          );

        normalScored.sort(
          (a, b) => {
            const scoreDiff =
              (b.relevanceScore ||
                0) -
              (a.relevanceScore ||
                0);

            if (
              scoreDiff !== 0
            ) {
              return scoreDiff;
            }

            return (
              new Date(
                b.postedAt ||
                  0
              ).getTime() -
              new Date(
                a.postedAt ||
                  0
              ).getTime()
            );
          }
        );

        const topJobs =
          normalScored.slice(
            0,
            20
          );

        const savedJobs =
          await Promise.all(
            topJobs.map(
              async (job) =>
                Job.findOneAndUpdate(
                  {
                    source:
                      job.source,
                    externalId:
                      job.externalId,
                  },

                  {
                    title:
                      job.title,

                    company:
                      job.company,

                    description:
                      job.description,

                    location:
                      job.location,

                    redirectUrl:
                      job.redirectUrl,

                    sourcePlatform:
                      job.sourcePlatform,

                    source:
                      job.source,

                    externalId:
                      job.externalId,

                    postedAt:
                      job.postedAt,

                    salaryMin:
                      job.salaryMin,

                    salaryMax:
                      job.salaryMax,

                    relevanceScore:
                      job.relevanceScore,

                    relevanceReason:
                      job.relevanceReason,

                    status:
                      "active",

                    createdBy:
                      user._id,
                  },

                  {
                    upsert:
                      true,

                    new: true,
                  }
                )
            )
          );

        return res.json({
          mode,
          query,
          role,
          experience,
          workType,
          locations,
          datePosted,
          fetchedCount:
            raw.length,
          dedupedCount:
            deduped.length,
          shortlistedCount:
            filtered.length,
          recommendedCount:
            savedJobs.length,
          jobs:
            savedJobs,
        });
      }

      // ---------------------------------------------------------
      // 13. RESUME MATCH SEARCH
      // ---------------------------------------------------------

      const skills =
        resumeSkills
          .map((skill) =>
            skill.toLowerCase()
          )
          .filter(Boolean);

      const scored =
        filtered.map(
          (job) => {
            const title =
              String(
                job.title ||
                  ""
              );

            const description =
              String(
                job.description ||
                  ""
              );

            const company =
              String(
                job.company ||
                  ""
              );

            const locationText =
              String(
                job.location ||
                  ""
              );

            const haystack =
              `
                ${title}
                ${description}
                ${company}
                ${locationText}
              `.toLowerCase();

            const matchedSkills =
              skills.filter(
                (skill) =>
                  haystack.includes(
                    skill
                  )
              );

            const roleText =
              title.toLowerCase();

            let roleScore =
              0;

            if (
              roleText.includes(
                "full stack"
              ) ||
              roleText.includes(
                "full-stack"
              )
            ) {
              roleScore += 5;
            }

            if (
              roleText.includes(
                "react"
              )
            ) {
              roleScore += 4;
            }

            if (
              roleText.includes(
                "node"
              )
            ) {
              roleScore += 4;
            }

            if (
              roleText.includes(
                "mern"
              )
            ) {
              roleScore += 5;
            }

            if (
              roleText.includes(
                "software developer"
              ) ||
              roleText.includes(
                "software engineer"
              )
            ) {
              roleScore += 3;
            }

            return {
              ...job,

              keywordOverlap:
                matchedSkills.length,

              matchedSkills,

              roleScore,
            };
          }
        );

      scored.sort(
        (a, b) =>
          b.keywordOverlap *
            10 +
          b.roleScore -
          (a.keywordOverlap *
            10 +
            a.roleScore)
      );

      // Only send the strongest candidates to Gemini.
      const shortlist =
        scored.slice(
          0,
          20
        );

      console.log(
        "Jobs sent to Gemini:",
        shortlist.length
      );

      // ---------------------------------------------------------
      // 14. GEMINI RESUME RANKING
      // ---------------------------------------------------------

      let ranked =
        shortlist;

      if (
        shortlist.length >
        0
      ) {
        const rankingInput =
          shortlist.map(
            (job, index) => ({
              index,
              title:
                job.title,

              company:
                job.company,

              location:
                job.location,

              postedAt:
                job.postedAt,

              sourcePlatform:
                job.sourcePlatform,

              matchedSkills:
                job.matchedSkills,

              snippet:
                String(
                  job.description ||
                    ""
                ).slice(
                  0,
                  600
                ),
            })
          );

        const ranking =
          await callClaudeJSON(
            {
              system: `
You are an expert technical recruiter.

Rank job postings against the candidate's real resume.

Never invent skills or experience.

The candidate is an MCA graduate / early-career Full Stack Developer.

Prefer strong matches for:
- Full Stack Development
- React.js
- Node.js
- JavaScript
- Python
- SQL
- MongoDB
- REST APIs
- .NET / ASP.NET

Strongly penalize jobs that clearly require 4+ years of experience.

Consider:
- Role relevance
- Technical skill match
- Experience fit
- Location
- Work type
- Resume projects
- Overall suitability
              `,

              prompt: `
Return ONLY valid JSON:

{
  "rankings": [
    {
      "index": 0,
      "relevanceScore": 85,
      "reason": "Strong React and Node.js match."
    }
  ]
}

Candidate resume skills:
${resumeSkills.join(
  ", "
)}

Candidate resume:
${user.resumeText.slice(
  0,
  3000
)}

Requested role:
${
  role ||
  "Full Stack Developer"
}

Requested experience:
${experience}

Requested work type:
${workType || "Any"}

Requested locations:
${
  locations.length
    ? locations.join(", ")
    : "Any"
}

Job list:
${JSON.stringify(
  rankingInput
)}
              `,

              maxTokens:
                3000,
            }
          );

        const scoreByIndex =
          new Map(
            (
              ranking.rankings ||
              []
            ).map(
              (item) => [
                Number(
                  item.index
                ),
                item,
              ]
            )
          );

        ranked =
          shortlist.map(
            (
              job,
              index
            ) => {
              const aiScore =
                scoreByIndex.get(
                  index
                );

              return {
                ...job,

                relevanceScore:
                  Number(
                    aiScore?.relevanceScore
                  ) ||
                  Math.min(
                    job.keywordOverlap *
                      10 +
                      job.roleScore,
                    100
                  ),

                relevanceReason:
                  aiScore?.reason ||
                  `Matched ${job.keywordOverlap} resume skill(s).`,
              };
            }
          );

        ranked.sort(
          (a, b) =>
            (b.relevanceScore ||
              0) -
            (a.relevanceScore ||
              0)
        );
      }

      // ---------------------------------------------------------
      // 15. SAVE TOP RESUME MATCHES
      // ---------------------------------------------------------

      const topJobs =
        ranked.slice(
          0,
          12
        );

      const savedJobs =
        await Promise.all(
          topJobs.map(
            (job) =>
              Job.findOneAndUpdate(
                {
                  source:
                    job.source,

                  externalId:
                    job.externalId,
                },

                {
                  title:
                    job.title,

                  company:
                    job.company,

                  description:
                    job.description,

                  location:
                    job.location,

                  redirectUrl:
                    job.redirectUrl,

                  sourcePlatform:
                    job.sourcePlatform,

                  source:
                    job.source,

                  externalId:
                    job.externalId,

                  postedAt:
                    job.postedAt,

                  salaryMin:
                    job.salaryMin,

                  salaryMax:
                    job.salaryMax,

                  relevanceScore:
                    job.relevanceScore,

                  relevanceReason:
                    job.relevanceReason,

                  status:
                    "active",

                  createdBy:
                    user._id,
                },

                {
                  upsert:
                    true,

                  new: true,
                }
              )
          )
        );

      // ---------------------------------------------------------
      // 16. RESPONSE
      // ---------------------------------------------------------

      return res.json({
        mode,
        query,
        role,
        experience,
        workType,
        locations,
        datePosted,

        fetchedCount:
          raw.length,

        dedupedCount:
          deduped.length,

        shortlistedCount:
          shortlist.length,

        recommendedCount:
          savedJobs.length,

        jobs:
          savedJobs,
      });
    } catch (err) {
      console.error(
        "Job search error:",
        err
      );

      return res.status(
        500
      ).json({
        error:
          err.message ||
          "Job search failed",
      });
    }
  }
);

// =============================================================
// MANUAL JOB ENTRY
// =============================================================

router.post(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      const {
        title,
        company,
        description,
        link,
        requiredSkills,
      } = req.body;

      const job =
        await Job.create({
          title,
          company,
          description,
          link,
          redirectUrl: link,

          sourcePlatform:
            "Manually added",

          source:
            "manual",

          requiredSkills:
            requiredSkills ||
            [],

          createdBy:
            req.userId,

          status:
            "unverified",
        });

      res
        .status(201)
        .json(job);
    } catch (err) {
      console.error(
        "Manual job creation error:",
        err
      );

      res.status(500).json({
        error:
          err.message,
      });
    }
  }
);

// =============================================================
// GET USER'S JOBS
// =============================================================

router.get(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      const jobs =
        await Job.find({
          createdBy:
            req.userId,
        }).sort({
          postedAt: -1,
          createdAt: -1,
        });

      res.json(jobs);
    } catch (err) {
      console.error(
        "Get jobs error:",
        err
      );

      res.status(500).json({
        error:
          err.message,
      });
    }
  }
);

// =============================================================
// GET SINGLE JOB
// =============================================================

router.get(
  "/:id",
  requireAuth,
  async (req, res) => {
    try {
      const job =
        await Job.findById(
          req.params.id
        );

      if (!job) {
        return res.status(
          404
        ).json({
          error:
            "Job not found",
        });
      }

      res.json(job);
    } catch (err) {
      console.error(
        "Get job error:",
        err
      );

      res.status(500).json({
        error:
          err.message,
      });
    }
  }
);

// =============================================================
// VERIFY JOB
// =============================================================

router.post(
  "/:id/verify",
  requireAuth,
  async (req, res) => {
    try {
      const job =
        await Job.findById(
          req.params.id
        );

      if (!job) {
        return res.status(
          404
        ).json({
          error:
            "Job not found",
        });
      }

      if (
        job.source ===
        "manual"
      ) {
        job.status =
          job.link
            ? "active"
            : "inactive";

        await job.save();
      }

      res.json(job);
    } catch (err) {
      console.error(
        "Job verification error:",
        err
      );

      res.status(500).json({
        error:
          err.message,
      });
    }
  }
);

export default router;