import { Link, useRouterState } from "@tanstack/react-router";
import { Home, TrafficCone, BookOpen, Phone, ClipboardCheck } from "lucide-react";

const items = [
  { to: "/", label: "سەرەکی", icon: Home },
  { to: "/signs", label: "هێماکان", icon: TrafficCone },
  { to: "/books", label: "کتێب", icon: BookOpen },
  { to: "/contact", label: "پەیوەندی", icon: Phone },
  { to: "/quiz", label: "تاقیکردنەوە", icon: ClipboardCheck },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl px-3 pb-3">
        <div className="glass-strong rounded-3xl px-2 py-2 flex items-center justify-around">
          {items.map((it) => {
            const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-2xl gradient-primary opacity-20 animate-pulse-glow" />
                )}
                <Icon className="relative size-5" strokeWidth={active ? 2.5 : 2} />
                <span className="relative text-[10px] font-medium">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
