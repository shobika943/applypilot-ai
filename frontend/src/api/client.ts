const BASE =
  "https://applypilot-ai-backend-1.onrender.com/api";

/* =========================================================
   REQUEST HEADERS
   ========================================================= */

function buildHeaders(
  options: RequestInit
): Headers {
  const headers =
    new Headers();

  /*
   * Do not add JSON content type
   * for FormData requests.
   */
  if (
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  /*
   * Add logged-in user's JWT.
   */
  const token =
    localStorage.getItem("token");

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  /*
   * Preserve custom headers.
   */
  if (options.headers) {
    const customHeaders =
      new Headers(
        options.headers
      );

    customHeaders.forEach(
      (value, key) => {
        headers.set(
          key,
          value
        );
      }
    );
  }

  return headers;
}

/* =========================================================
   GENERIC REQUEST
   ========================================================= */

async function request(
  path: string,
  options: RequestInit = {}
) {
  const method =
    (
      options.method ||
      "GET"
    ).toUpperCase();

  const requestOptions: RequestInit = {
    ...options,

    /*
     * Prevent browser caching for GET
     * requests.
     */
    cache:
      method === "GET"
        ? "no-store"
        : options.cache,

    headers:
      buildHeaders(
        options
      ),
  };

  const response =
    await fetch(
      `${BASE}${path}`,
      requestOptions
    );

  /*
   * 204 means there is no response body.
   */
  if (
    response.status === 204
  ) {
    return {};
  }

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   API
   ========================================================= */

export const api = {
  /* =======================================================
     AUTH
     ======================================================= */

  register: (
    body: any
  ) =>
    request(
      "/auth/register",
      {
        method: "POST",
        body:
          JSON.stringify(
            body
          ),
      }
    ),

  login: (
    body: any
  ) =>
    request(
      "/auth/login",
      {
        method: "POST",
        body:
          JSON.stringify(
            body
          ),
      }
    ),

  /* =======================================================
     PROFILE
     ======================================================= */

  getProfile: () =>
    request(
      "/profile"
    ),

  getMyApplications:
    async () => {
      const data =
        await request(
          "/profile"
        );

      return (
        data?.applications ||
        []
      );
    },

  /* =======================================================
     RESUME
     ======================================================= */

  uploadResume: (
    file: File
  ) => {
    const form =
      new FormData();

    form.append(
      "resume",
      file
    );

    return request(
      "/resume/upload",
      {
        method: "POST",
        body: form,
      }
    );
  },

  me: () =>
    request(
      "/resume/me"
    ),

  /* =======================================================
     JOBS
     ======================================================= */

  listJobs: () =>
    request(
      "/jobs"
    ),

  searchJobs: ({
    mode = "normal",
    query = "",
    role = "",
    experience = "any",
    workType = [],
    locations = [],
    datePosted = "1w",
    page = 1,
  }: {
    mode?:
      | "normal"
      | "resume"
      | "manual";

    query?: string;

    role?: string;

    experience?: string;

    workType?: string[];

    locations?: string[];

    datePosted?: string;

    page?: number;
  } = {}) => {
    const params =
      new URLSearchParams();

    params.set(
      "mode",
      mode
    );

    params.set(
      "datePosted",
      datePosted
    );

    params.set(
      "page",
      String(page)
    );

    /*
     * Prevent cached job-search responses.
     */
    params.set(
      "_ts",
      String(
        Date.now()
      )
    );

    if (
      query.trim()
    ) {
      params.set(
        "query",
        query.trim()
      );
    }

    if (
      role.trim()
    ) {
      params.set(
        "role",
        role.trim()
      );
    }

    if (
      experience &&
      experience !== "any"
    ) {
      params.set(
        "experience",
        experience
      );
    }

    if (
      workType.length >
      0
    ) {
      params.set(
        "workType",
        workType.join(",")
      );
    }

    if (
      locations.length >
      0
    ) {
      params.set(
        "location",
        locations.join(",")
      );
    }

    return request(
      `/jobs/search?${params.toString()}`
    );
  },

  createJob: (
    body: any
  ) =>
    request(
      "/jobs",
      {
        method: "POST",
        body:
          JSON.stringify(
            body
          ),
      }
    ),

  getJob: (
    id: string
  ) =>
    request(
      `/jobs/${id}`
    ),

  verifyJob: (
    id: string
  ) =>
    request(
      `/jobs/${id}/verify`,
      {
        method: "POST",
      }
    ),

  /* =======================================================
     APPLICATION / MATCHING
     ======================================================= */

  getApplication: (
    jobId: string
  ) =>
    request(
      `/match/${jobId}`
    ),

  matchJob: (
    jobId: string
  ) =>
    request(
      `/match/${jobId}`,
      {
        method: "POST",
      }
    ),

  clickApply: (
    jobId: string
  ) =>
    request(
      `/match/${jobId}/click-apply`,
      {
        method: "POST",
      }
    ),

  confirmApplied: (
    jobId: string,
    applied: boolean
  ) =>
    request(
      `/match/${jobId}/confirm`,
      {
        method: "POST",
        body:
          JSON.stringify({
            applied,
          }),
      }
    ),

  /* =======================================================
     INTERVIEW PREPARATION
     ======================================================= */

  generateGuide: (
    applicationId: string,
    questionCount: number = 60
  ) =>
    request(
      `/interview/generate/${applicationId}`,
      {
        method: "POST",
        body:
          JSON.stringify({
            questionCount,
          }),
      }
    ),

  getGuide: (
    applicationId: string
  ) =>
    request(
      `/interview/${applicationId}`
    ),

  /* =======================================================
     MOCK INTERVIEW
     ======================================================= */

  startMockInterview: (
    guideId: string,
    newSession: boolean = false
  ) =>
    request(
      `/mock-interview/start/${guideId}`,
      {
        method: "POST",
        body:
          JSON.stringify({
            newSession,
          }),
      }
    ),

  getMockSession: (
    mockId: string
  ) =>
    request(
      `/mock-interview/session/${mockId}`
    ),

  submitAnswer: (
    mockId: string,
    answer: string
  ) =>
    request(
      `/mock-interview/${mockId}/answer`,
      {
        method: "POST",
        body:
          JSON.stringify({
            answer,
          }),
      }
    ),

  getReport: (
    mockId: string
  ) =>
    request(
      `/mock-interview/${mockId}/report`
    ),
};