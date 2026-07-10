import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseServer } from "@/integrations/supabase/server";
import { getQuizQuestionsByIds } from "@/lib/db/store.server";

const submitSchema = z.object({
  token: z.string(),
  device: z.string(),
  answers: z.array(
    z.object({
      questionId: z.number().int(),
      selected: z.enum(["A", "B", "C", "NONE"]),
    }),
  ).min(1).max(100),
});

export const submitQuiz = createServerFn({ method: "POST" })
  .validator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    // Get user from session
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('session_token', data.token)
      .eq('device_id', data.device)
      .single();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get quiz questions from local store (static data)
    const ids = data.answers.map((a) => a.questionId);
    const rows = getQuizQuestionsByIds(ids);
    const correctMap = new Map(rows.map((r) => [r.id, r.correct_option]));

    const graded = data.answers.map((a) => {
      const question = rows.find(r => r.id === a.questionId);
      const correct = correctMap.get(a.questionId) ?? "";
      return {
        questionId: a.questionId,
        question: question?.question ?? "",
        option_a: question?.option_a ?? "",
        option_b: question?.option_b ?? "",
        option_c: question?.option_c ?? "",
        image_url: question?.image_url ?? null,
        selected: a.selected,
        correct,
        isCorrect: a.selected !== "NONE" && a.selected === correct,
      };
    });
    const total = graded.length;
    const correctCount = graded.filter((g) => g.isCorrect).length;
    const score = (correctCount / total) * 100;
    const passed = score >= 80;

    // Insert quiz attempt into Supabase
    const { error: insertError } = await supabaseServer
      .from('quiz_history')
      .insert({
        user_id: user.id,
        total_questions: total,
        correct_count: correctCount,
        score_percent: score,
        passed,
        details: graded,
      });

    if (insertError) {
      throw new Error("Failed to save quiz result");
    }

    return { passed, score, graded };
  });

export const getQuizHistory = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string(), device: z.string() }).parse(d))
  .handler(async ({ data }) => {
    // Set device context for RLS
    await supabaseServer.rpc('set_device_context', { device_id: data.device });

    // Get user from session
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('session_token', data.token)
      .eq('device_id', data.device)
      .single();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get quiz history from Supabase
    const { data: history, error: historyError } = await supabaseServer
      .from('quiz_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      throw new Error("Failed to fetch quiz history");
    }

    // Transform to match expected format
    return history.map(h => ({
      id: h.id,
      total_questions: h.total_questions,
      correct_count: h.correct_count,
      score_percent: h.score_percent,
      passed: h.passed,
      created_at: h.created_at,
      details: h.details,
    }));
  });
