export type Tier = "15_days" | "1_month" | "lifetime";

export type AccessCode = {
  id: string;
  code: string;
  tier: Tier;
  duration_days: number | null;
  first_used_at: string | null;
  is_revoked: boolean;
  is_admin: boolean;
  created_at: string;
};

export type DeviceBinding = {
  id: string;
  code_id: string;
  device_fingerprint: string;
  session_token: string;
  user_agent: string | null;
  bound_at: string;
  last_seen_at: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  category: string | null;
  image_url: string | null;
};

export type QuizAttempt = {
  id: string;
  code_id: string;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  passed: boolean;
  details: GradedAnswer[];
  created_at: string;
};

export type TrafficSign = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  display_order: number;
};

export type Contact = {
  id: number;
  role: string;
  name: string;
  phone: string;
  image_url: string | null;
  display_order: number;
};

export type GradedAnswer = {
  questionId: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  selected: "A" | "B" | "C" | "NONE";
  correct: string;
  isCorrect: boolean;
  image_url: string | null;
};
