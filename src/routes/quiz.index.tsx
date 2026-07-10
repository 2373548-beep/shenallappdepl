import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { getQuizHistory } from "@/lib/quiz.functions";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { ClipboardCheck, Play, Trophy, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/quiz/")({
  head: () => ({
    meta: [
      { title: "تاقیکردنەوە — نوسینگەی شۆفێری شێنێێ" },
      { name: "description", content: "تاقیکردنەوەی ٢٥ پرسیار و مێژووی ئەنجامەکان" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <QuizHome />
    </AuthGuard>
  ),
});

function QuizHome() {
  const { token, device, authed } = useAuth();
  const historyFn = useServerFn(getQuizHistory);
  const { data: history, isLoading } = useQuery({
    queryKey: ["history", token],
    enabled: authed && !!token,
    queryFn: () => historyFn({ data: { token: token!, device } }),
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const passed = history?.filter((h) => h.passed).length ?? 0;
  const total = history?.length ?? 0;

  return (
    <main className="min-h-screen pb-28">
      <header className="px-4 pt-10 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl gradient-success flex items-center justify-center">
            <ClipboardCheck className="size-6 text-success-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تاقیکردنەوە</h1>
            <p className="text-xs text-muted-foreground">٢٥ پرسیار · ٦٠ چرکە بۆ هەریەکە · نمرەی دەرچوون ٨٠٪</p>
          </div>
        </div>
      </header>

      <div className="px-4 max-w-2xl mx-auto space-y-4">
        <Link to="/quiz/play">
          <div className="glass-strong rounded-3xl p-6 relative overflow-hidden active:scale-[0.99] transition group">
            <div className="absolute inset-0 gradient-primary opacity-10" />
            <div className="absolute -bottom-8 -right-8 size-40 gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ئامادەی؟</p>
                <p className="text-2xl font-bold text-gradient">دەست بکە بە تاقیکردنەوە</p>
              </div>
              <div className="size-16 rounded-2xl gradient-primary flex items-center justify-center glow">
                <Play className="size-8 text-primary-foreground" fill="currentColor" />
              </div>
            </div>
          </div>
        </Link>

        {total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="کۆی هەوڵەکان" value={total} icon={ClipboardCheck} tint="primary" />
            <Stat label="دەرچوون" value={passed} icon={Trophy} tint="success" />
            <Stat label="ڕێژەی سەرکەوتن" value={`${Math.round((passed / total) * 100)}٪`} icon={Trophy} tint="accent" />
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">مێژووی ئەنجامەکان</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="glass rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                    className="w-full p-4 flex items-center gap-3 text-right"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${h.passed ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                      {h.passed ? <Trophy className="size-5" /> : <XCircle className="size-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {h.correct_count} / {h.total_questions} <span className="text-muted-foreground font-normal">پرسیار</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" />
                        {new Date(h.created_at).toLocaleString("ar-IQ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${h.passed ? "text-success" : "text-destructive"}`}>
                        {Math.round(Number(h.score_percent))}٪
                      </span>
                      {expandedId === h.id ? (
                        <ChevronUp className="size-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {expandedId === h.id && (
                    <div className="border-t border-glass-border px-4 pb-4 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground pt-3">پێداچوونەوەی وەڵامەکان</h3>
                      {h.details.map((a, i) => (
                        <div key={i} className={`rounded-2xl p-4 border-2 ${a.isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${a.isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                              {i + 1}
                            </span>
                            <span className={`text-xs font-semibold ${a.isCorrect ? "text-success" : a.selected === "NONE" ? "text-destructive" : "text-destructive"}`}>
                              {a.isCorrect ? "وەڵام ڕاست" : a.selected === "NONE" ? "وەڵام نەدرا" : "وەڵام هەڵە"}
                            </span>
                          </div>

                          {a.image_url && (
                            <img
                              src={a.image_url}
                              alt=""
                              className="w-full max-h-40 object-contain rounded-xl mb-3 bg-background/40"
                            />
                          )}

                          <p className="text-sm font-medium mb-3">{a.question}</p>

                          <div className="space-y-2">
                            {(["A", "B", "C"] as const).map((opt) => {
                              let className = "rounded-lg p-2 border border-glass-border text-xs flex items-center justify-between";
                              if (opt === a.correct) {
                                className += " bg-success/10 border-success/30";
                              }
                              if (a.selected === opt && !a.isCorrect) {
                                className += " bg-destructive/10 border-destructive/30";
                              }

                              return (
                                <div key={opt} className={className}>
                                  <span>
                                    {opt === "A" ? a.option_a : opt === "B" ? a.option_b : a.option_c}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold opacity-60">{opt}</span>
                                    {opt === a.correct && <span className="text-success text-[10px] font-semibold">وەڵام ڕاست</span>}
                                    {a.selected === opt && <span className={a.isCorrect ? "text-success text-[10px] font-semibold" : "text-destructive text-[10px] font-semibold"}>وەڵامەکەت</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              هێشتا هیچ تاقیکردنەوەیەکت نەکردووە
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function Stat({ label, value, icon: Icon, tint }: { label: string; value: number | string; icon: typeof Trophy; tint: "primary" | "success" | "accent" }) {
  const bg = tint === "success" ? "bg-success/20 text-success" : tint === "accent" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary";
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className={`size-9 mx-auto rounded-xl flex items-center justify-center mb-1 ${bg}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
