// backend/utils/aiClient.js
//
// Central AI wrapper for ApplyPilot AI.
// Uses Google's Gemini API for:
// - Resume skill extraction
// - Job/resume matching
// - Interview question generation
// - Interview answers
// - Mock interview evaluation

import axios from "axios";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set in backend/.env file"
    );
  }

  // Use a model that can be changed from .env.
  const model =
    process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  return {
    apiKey,
    model,
  };
}

/**
 * Call Gemini and return plain text.
 */
export async function callClaude({
  system = "",
  prompt = "",
  maxTokens = 2000,
}) {
  const { apiKey, model } = getConfig();

  const url = `${GEMINI_BASE_URL}/${model}:generateContent`;

  try {
    console.log("Calling Gemini...");
    console.log("Model:", model);
    console.log("URL:", url);

    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${system}

${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        // Prevent a request from hanging forever.
        timeout: 60000,

        // Force IPv4 first on Windows/Node environments
        // where IPv6 routing can cause connection problems.
        family: 4,
      }
    );

    const parts =
      response.data?.candidates?.[0]?.content?.parts || [];

    const text = parts
      .filter(
        (part) => typeof part.text === "string"
      )
      .map((part) => part.text)
      .join("")
      .trim();

    if (!text) {
      console.error(
        "Gemini response:",
        JSON.stringify(response.data, null, 2)
      );

      throw new Error(
        "Gemini returned an empty response"
      );
    }

    return text;
  } catch (error) {
    console.error("\n========== GEMINI ERROR ==========");

    if (error.response) {
      console.error(
        "HTTP Status:",
        error.response.status
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
        error.code
      );

      console.error(
        "Error Message:",
        error.message
      );
    }

    console.error(
      "==================================\n"
    );

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Gemini API request failed";

    throw new Error(message);
  }
}

/**
 * Call Gemini and return parsed JSON.
 */
export async function callClaudeJSON({
  system = "",
  prompt = "",
  maxTokens = 2000,
}) {
  const { apiKey, model } = getConfig();

  const url = `${GEMINI_BASE_URL}/${model}:generateContent`;

  try {
    console.log("Calling Gemini JSON...");
    console.log("Model:", model);
    console.log("URL:", url);

    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${system}

${prompt}

IMPORTANT:
Return ONLY valid JSON.
Do not use markdown code fences.
Do not include explanations outside the JSON.`,
              },
            ],
          },
        ],

        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        timeout: 60000,

        // Important for your Windows environment.
        family: 4,
      }
    );

    const parts =
      response.data?.candidates?.[0]?.content?.parts || [];

    const raw = parts
      .filter(
        (part) => typeof part.text === "string"
      )
      .map((part) => part.text)
      .join("")
      .trim();

    if (!raw) {
      console.error(
        "Gemini response:",
        JSON.stringify(response.data, null, 2)
      );

      throw new Error(
        "Gemini returned an empty JSON response"
      );
    }

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON:"
      );

      console.error(cleaned);

      throw new Error(
        "Gemini returned invalid JSON"
      );
    }
  } catch (error) {
    console.error(
      "\n========== GEMINI JSON ERROR =========="
    );

    if (error.response) {
      console.error(
        "HTTP Status:",
        error.response.status
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
        error.code
      );

      console.error(
        "Error Message:",
        error.message
      );
    }

    console.error(
      "=======================================\n"
    );

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Gemini API request failed";

    throw new Error(message);
  }
}