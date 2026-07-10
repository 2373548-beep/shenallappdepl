import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { TrafficCone, ClipboardCheck, BookOpen, Phone, LogOut, Shield, CalendarClock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سەرەکی — نوسینگەی شۆفێری شێنێ" },
      { name: "description", content: "ئەپڵیکەیشنی فێرکاری و تاقیکردنەوەی شۆفێری" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <Home />
    </AuthGuard>
  ),
});

function Home() {
  const { tier, daysLeft, isAdmin, logout } = useAuth();
  const tierLabel = tier === "lifetime" ? "بێ کۆتایی" : tier === "1_month" ? "١ مانگ" : "١٥ ڕۆژ";

  return (
    <main className="min-h-screen pb-28">
      <header className="px-4 pt-10 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">بەخێربێیت بۆ</p>
            <h1 className="text-2xl font-bold text-gradient">شۆفێری شێنێ</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link to="/admin" className="glass rounded-2xl p-2.5"><Shield className="size-5 text-accent" /></Link>
            )}
            <button onClick={logout} className="glass rounded-2xl p-2.5"><LogOut className="size-5" /></button>
          </div>
        </div>
      </header>

      <section className="px-4 max-w-2xl mx-auto space-y-4">
        {/* Status card */}
        <div className="glass-strong rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-8 -left-8 size-32 rounded-full gradient-primary opacity-30 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl gradient-primary flex items-center justify-center glow">
              <CalendarClock className="size-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">ئاستی کۆدەکەت</p>
              <p className="text-lg font-bold">{tierLabel}</p>
              {daysLeft !== null && (
                <p className="text-xs mt-0.5">
                  <span className="text-accent font-semibold">{daysLeft}</span>
                  <span className="text-muted-foreground"> ڕۆژ ماوە</span>
                </p>
              )}
              {daysLeft === null && tier === "lifetime" && (
                <p className="text-xs text-success mt-0.5 flex items-center gap-1"><Sparkles className="size-3" /> چالاکی بەردەوام</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick action: Start quiz */}
        <Link to="/quiz" className="block">
          <div className="glass-strong rounded-3xl p-6 relative overflow-hidden group active:scale-[0.99] transition">
            <div className="absolute top-0 right-0 size-40 gradient-success opacity-20 blur-3xl rounded-full" />
            <div className="relative flex items-center gap-4">
              <div className="size-16 rounded-2xl gradient-success flex items-center justify-center">
                <ClipboardCheck className="size-8 text-success-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">دەست بکە بە تاقیکردنەوە</p>
                <p className="text-sm text-muted-foreground">٢٥ پرسیار · ٦٠ چرکە بۆ هەر پرسیار</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard to="/signs" icon={TrafficCone} title="هێماکانی هاتوچۆ" desc="فێربە بە وێنە" tint="primary" />
          <FeatureCard to="/books" icon={BookOpen} title="کتێبەکان" desc="بخوێنەرەوە" tint="accent" />
          <FeatureCard to="/contact" icon={Phone} title="پەیوەندی" desc="ستافی نوسینگە" tint="primary" />
          <FeatureCard to="/quiz" icon={ClipboardCheck} title="مێژووی ئەنجامەکان" desc="بزانە چۆن باشتر دەبیت" tint="accent" />
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function FeatureCard({ to, icon: Icon, title, desc, tint }: { to: string; icon: typeof TrafficCone; title: string; desc: string; tint: "primary" | "accent" }) {
  return (
    <Link to={to} className="glass rounded-3xl p-4 block active:scale-[0.98] transition">
      <div className={`size-11 rounded-xl mb-3 flex items-center justify-center ${tint === "primary" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
        <Icon className="size-5" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </Link>
  );
}
