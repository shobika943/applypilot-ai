export interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  link?: string;
  redirectUrl?: string;
  sourcePlatform?: string;
  source: "adzuna" | "manual";
  postedAt?: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  relevanceScore?: number;
  relevanceReason?: string;
  status: "active" | "inactive" | "unverified";
}

export type DatePosted = "any" | "24h" | "3d" | "1w" | "1m";

export interface Application {
  _id: string;
  job: string;
  matchScore: number | null;
  matchedSkills: string[];
  skillGaps: string[];
  status: "matched" | "saved" | "applied" | "prepping" | "interviewed";
  clickedApplyAt?: string;
  appliedAt?: string;
}

export interface InterviewQuestion {
  _id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  priority: string;
  whyItMatters: string;
  bucket: string;
}

export interface InterviewGuide {
  _id: string;
  totalQuestions: number;
  breakdown: Record<string, number>;
  questions: InterviewQuestion[];
}

export interface Evaluation {
  score: number;
  correctPoints: string[];
  missingPoints: string[];
  improvedAnswer: string;
  followUp: string;
}
