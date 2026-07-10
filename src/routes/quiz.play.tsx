import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { getQuizQuestions } from "@/lib/data.functions";
import { submitQuiz } from "@/lib/quiz.functions";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Trophy, XCircle, ArrowLeft, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/quiz/play")({
  head: () => ({
    meta: [
      { title: "تاقیکردنەوەی چالاک — شێنێ" },
      { name: "description", content: "تاقیکردنەوەی ٢٥ پرسیاری چالاک" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <QuizPlay />
    </AuthGuard>
  ),
});

const QUESTION_COUNT = 25;
const TIME_PER_Q = 60;

type Q = {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  image_url: string | null;
};

type Answer = { questionId: number; selected: "A" | "B" | "C" | "NONE" };
type Graded = Answer & {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  image_url: string | null;
  correct: string;
  isCorrect: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizPlay() {
  const navigate = useNavigate();
  const { token, device } = useAuth();
  const submit = useServerFn(submitQuiz);
  const fetchQuestions = useServerFn(getQuizQuestions);

  const { data: pool, isLoading } = useQuery({
    queryKey: ["all-questions"],
    enabled: !!token,
    queryFn: async () => (await fetchQuestions({ data: { token: token!, device } })) as Q[],
  });

  const questions = useMemo(() => (pool ? shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length)) : []), [pool]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<"A" | "B" | "C" | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number; graded: Graded[] } | null>(null);
  const lockedRef = useRef(false);

  const current = questions[idx];

  // Timer
  useEffect(() => {
    if (finished || !current) return;
    setTimeLeft(TIME_PER_Q);
    lockedRef.current = false;
    setPicked(null);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          if (!lockedRef.current) handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current, finished]);

  const handleAnswer = (choice: "A" | "B" | "C" | null) => {
    if (lockedRef.current || !current) return;
    lockedRef.current = true;
    setPicked(choice);
    const ans: Answer = {
      questionId: current.id,
      selected: choice ?? "NONE",
    };
    setAnswers((a) => [...a, ans]);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        void finish([...answers, ans]);
      } else {
        setIdx((i) => i + 1);
      }
    }, 800);
  };

  const finish = async (finalAnswers: Answer[]) => {
    setFinished(true);
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          token: token!,
          device,
          answers: finalAnswers,
        },
      });
      setResult(res);
    } catch {
      setResult({ passed: false, score: 0, graded: finalAnswers.map((a) => ({ ...a, correct: "", isCorrect: false })) });
    } finally {
      setSubmitting(false);
    }
  };


  if (isLoading || !current) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (finished) return <ResultView result={result} submitting={submitting} onRetry={() => navigate({ to: "/quiz/play" })} onHome={() => navigate({ to: "/quiz" })} />;

  const options: { key: "A" | "B" | "C"; text: string }[] = [
    { key: "A", text: current.option_a },
    { key: "B", text: current.option_b },
    { key: "C", text: current.option_c },
  ];
  const timePct = (timeLeft / TIME_PER_Q) * 100;
  const timeColor = timeLeft > 30 ? "text-success" : timeLeft > 15 ? "text-warning" : "text-destructive";

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate({ to: "/quiz" })} className="glass rounded-2xl p-2.5">
          <ArrowLeft className="size-5 rotate-180" />
        </button>
        <div className="text-sm font-semibold">
          <span className="text-primary">{idx + 1}</span>
          <span className="text-muted-foreground"> / {questions.length}</span>
        </div>
        <TimerRing timeLeft={timeLeft} pct={timePct} color={timeColor} />
      </header>

      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-6">
        <div className="h-full gradient-primary transition-all duration-300" style={{ width: `${((idx) / questions.length) * 100}%` }} />
      </div>

      <div className="glass-strong rounded-3xl p-6 mb-4 space-y-4">
        {current.image_url && (
          <img 
            src={current.image_url} 
            alt="" 
            className="w-full max-h-80 object-contain rounded-2xl bg-background/40"
          />
        )}
        <p className="text-lg leading-relaxed font-medium">{current.question}</p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const isPicked = picked === opt.key;
          const showResult = picked !== null;
          const cls = !showResult
            ? "glass hover:bg-glass-border"
            : isPicked
            ? "bg-primary/30 border-primary text-primary"
            : "glass opacity-50";
          return (
            <button
              key={opt.key}
              disabled={lockedRef.current}
              onClick={() => handleAnswer(opt.key)}
              className={`w-full text-right rounded-2xl p-4 border border-glass-border transition-all active:scale-[0.98] flex items-center gap-3 ${cls}`}
            >
              <span className="size-9 rounded-xl bg-background/40 flex items-center justify-center font-bold text-sm shrink-0">
                {opt.key}
              </span>
              <span className="flex-1 text-sm">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function TimerRing({ timeLeft, pct, color }: { timeLeft: number; pct: number; color: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-12">
      <svg className="size-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          cx="22" cy="22" r={r} fill="none" strokeWidth="3" strokeLinecap="round"
          className={color}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color}`}>{timeLeft}</div>
    </div>
  );
}

function ResultView({
  result, submitting, onRetry, onHome,
}: {
  result: { passed: boolean; score: number; graded: Graded[] } | null;
  submitting: boolean;
  onRetry: () => void;
  onHome: () => void;
}) {
  if (submitting || !result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  const graded = result.graded;
  const correct = graded.filter((a) => a.isCorrect).length;

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      {result.passed && <Confetti />}
      <div className={`glass-strong rounded-3xl p-8 text-center relative overflow-hidden ${result.passed ? "animate-pulse-glow" : ""}`}>
        <div className={`absolute inset-0 opacity-20 ${result.passed ? "gradient-success" : "gradient-danger"}`} />
        <div className="relative">
          <div className={`size-24 mx-auto rounded-full flex items-center justify-center mb-4 animate-float ${result.passed ? "gradient-success" : "gradient-danger"}`}>
            {result.passed ? <Trophy className="size-12 text-success-foreground" /> : <XCircle className="size-12 text-destructive-foreground" />}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {result.passed ? "پیرۆزە! دەرچوویت" : "بەداخەوە، دەرنەچوویت"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">نمرەی دەرچوون: ٨٠٪</p>
          <div className="text-6xl font-black text-gradient mb-2">{Math.round(result.score)}٪</div>
          <p className="text-sm text-muted-foreground">
            {correct} لە {graded.length} پرسیار ڕاست بوون
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={onRetry} className="glass-strong rounded-2xl p-4 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <RotateCcw className="size-5" />
          دووبارە
        </button>
        <button onClick={onHome} className="gradient-primary rounded-2xl p-4 font-semibold text-primary-foreground glow active:scale-[0.98] transition">
          گەڕانەوە
        </button>
      </div>

      <h2 className="mt-8 mb-3 px-1 text-sm font-semibold text-muted-foreground">پێداچوونەوەی وەڵامەکان</h2>
      <div className="space-y-4">
        {graded.map((a, i) => (
          <div key={i} className={`glass rounded-3xl p-5 border-2 ${a.isCorrect ? "border-success/30" : "border-destructive/30"}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${a.isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                {i + 1}
              </div>
              <div className="flex flex-col items-end">
                {a.isCorrect ? (
                  <span className="text-sm font-semibold text-success">وەڵام ڕاست</span>
                ) : a.selected === "NONE" ? (
                  <span className="text-sm font-semibold text-destructive">وەڵام نەدرا</span>
                ) : (
                  <span className="text-sm font-semibold text-destructive">وەڵام هەڵە</span>
                )}
              </div>
            </div>

            {a.image_url && (
              <img
                src={a.image_url}
                alt=""
                className="w-full max-h-60 object-contain rounded-2xl mb-4 bg-background/40"
              />
            )}

            <p className="text-sm font-medium mb-4">{a.question}</p>

            <div className="space-y-2">
              {(["A", "B", "C"] as const).map((opt) => {
                let className = "rounded-xl p-3 border border-glass-border text-sm flex items-center justify-between";
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
                      <span className="text-xs font-bold opacity-60">{opt}</span>
                      {opt === a.correct && <span className="text-success text-xs font-semibold">وەڵام ڕاست</span>}
                      {a.selected === opt && <span className={a.isCorrect ? "text-success text-xs font-semibold" : "text-destructive text-xs font-semibold"}>وەڵامەکەت</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ["oklch(0.72 0.20 155)", "oklch(0.78 0.20 200)", "oklch(0.80 0.18 75)", "oklch(0.70 0.18 240)"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute size-2 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            background: colors[i % colors.length],
            animation: `confetti ${2 + Math.random() * 2}s linear ${Math.random()}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
