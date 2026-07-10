import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loginWithCode } from "@/lib/auth.functions";
import { getDeviceFingerprint, sessionStore } from "@/lib/device";
import { useAuth } from "@/lib/auth-context";
import { TrafficCone, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "چوونەژوورەوە — شێنێ" },
      { name: "description", content: "بە کۆدی چالاککردن بچۆ ژوورەوە" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const login = useServerFn(loginWithCode);
  const navigate = useNavigate();
  const { setSession, authed, loading } = useAuth();

  useEffect(() => {
    if (!loading && authed) navigate({ to: "/" });
  }, [loading, authed, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    if (onlyDigits.length <= 6) {
      setCode(onlyDigits);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    try {
      const device = getDeviceFingerprint();
      const res = await login({ data: { code, device, userAgent: navigator.userAgent } });
      sessionStore.set(res.sessionToken, remember);
      setSession(res.sessionToken, res.isAdmin, res.tier, res.durationDays);
      toast.success("بەخێربێیت!");
      navigate({ to: res.isAdmin ? "/admin" : "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "هەڵە ڕوویدا");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-float">
          <div className="inline-flex size-20 items-center justify-center rounded-3xl gradient-primary glow mb-4">
            <TrafficCone className="size-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">نوسینگەی شۆفێری شێنێ</h1>
          <p className="mt-2 text-sm text-muted-foreground">فێرکاری و تاقیکردنەوەی شۆفێری</p>
        </div>

        <form onSubmit={submit} className="glass-strong rounded-3xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-center">کۆدی چالاککردن (٦ ژمارە)</label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleChange}
              className="w-full text-center text-3xl font-bold rounded-2xl bg-input border-2 border-glass-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition py-4"
            />
          </div>

          <label className="flex items-center justify-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-primary" />
            <span>منت لەبیر بێت لەسەر ئەم ئامێرە</span>
          </label>

          <button
            type="submit"
            disabled={code.length !== 6 || submitting}
            className="w-full rounded-2xl gradient-primary px-6 py-3.5 font-semibold text-primary-foreground glow disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
            چوونەژوورەوە
          </button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            هەر کۆدێک تەنها بۆ یەک ئامێر چالاک دەکرێت. بۆ بەدەستهێنانی کۆد، پەیوەندی بە نوسینگەکە بکە.
          </p>
        </form>
      </div>
    </main>
  );
}
