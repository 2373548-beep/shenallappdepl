import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthGuard } from "@/components/AuthGuard";
import { listCodes, resetBinding, revokeCode, adminStats } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";
import { Shield, RotateCcw, Ban, CheckCircle2, Loader2, Users, KeyRound, AlertTriangle, LogOut, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — شێنێ" }] }),
  component: () => (
    <AuthGuard adminOnly>
      <Admin />
    </AuthGuard>
  ),
});

function Admin() {
  const { token, device, logout } = useAuth();
  const qc = useQueryClient();
  const [tier, setTier] = useState<"all" | "15_days" | "1_month" | "lifetime">("all");
  const listFn = useServerFn(listCodes);
  const resetFn = useServerFn(resetBinding);
  const revokeFn = useServerFn(revokeCode);
  const statsFn = useServerFn(adminStats);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsFn({ data: { token: token!, device } }),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-codes", tier],
    queryFn: () => listFn({ data: { token: token!, device, tier, status: "all", limit: 200 } }),
  });

  const reset = async (codeId: string) => {
    if (!confirm("ئامێرە بەستراوەکە بسڕیتەوە؟ ئەو کۆدە دەتوانێت لەسەر ئامێرێکی نوێ بەکاربێت.")) return;
    await resetFn({ data: { token: token!, device, codeId } });
    toast.success("بەستنەوەی ئامێر سڕایەوە");
    qc.invalidateQueries({ queryKey: ["admin-codes"] });
  };
  const revoke = async (codeId: string, revoke: boolean) => {
    await revokeFn({ data: { token: token!, device, codeId, revoke } });
    toast.success(revoke ? "کۆد هەڵوەشێنرایەوە" : "کۆد چالاککرایەوە");
    qc.invalidateQueries({ queryKey: ["admin-codes"] });
  };

  return (
    <main className="min-h-screen pb-10 px-4 pt-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="glass rounded-2xl p-2.5"><ArrowLeft className="size-5 rotate-180" /></Link>
        <div className="flex items-center gap-2">
          <Shield className="size-6 text-accent" />
          <h1 className="text-xl font-bold">پانێلی بەڕێوەبردن</h1>
        </div>
        <button onClick={logout} className="glass rounded-2xl p-2.5"><LogOut className="size-5" /></button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox label="کۆی کۆد" value={stats?.total ?? "—"} icon={KeyRound} />
        <StatBox label="بەکارهاتوو" value={stats?.used ?? "—"} icon={CheckCircle2} />
        <StatBox label="بەستراو" value={stats?.bound ?? "—"} icon={Users} />
        <StatBox label="هەڵوەشێنراوە" value={stats?.revoked ?? "—"} icon={AlertTriangle} />
      </div>

      <div className="glass rounded-2xl p-1.5 flex gap-1 mb-4">
        {(["all", "lifetime", "1_month", "15_days"] as const).map((t) => (
          <button key={t} onClick={() => setTier(t)} className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${tier === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t === "all" ? "هەموو" : t === "lifetime" ? "بێ کۆتایی" : t === "1_month" ? "١ مانگ" : "١٥ ڕۆژ"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {data?.map((c) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const binding = (c.device_bindings as any)?.[0] ?? (c.device_bindings as any);
            return (
              <div key={c.id} className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap">
                <div className="font-mono text-lg font-bold tracking-wider" dir="ltr">{c.code}</div>
                <div className="text-xs text-muted-foreground">{c.tier}</div>
                {c.is_revoked && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">هەڵوەشێنراوە</span>}
                {binding ? (
                  <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">بەستراو</span>
                ) : (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">بەکارنەهاتوو</span>
                )}
                <div className="flex-1" />
                {binding && (
                  <button onClick={() => reset(c.id)} className="text-xs glass rounded-lg px-2 py-1 flex items-center gap-1">
                    <RotateCcw className="size-3" /> سڕینەوەی ئامێر
                  </button>
                )}
                <button onClick={() => revoke(c.id, !c.is_revoked)} className="text-xs glass rounded-lg px-2 py-1 flex items-center gap-1">
                  <Ban className="size-3" /> {c.is_revoked ? "چالاککردنەوە" : "هەڵوەشاندنەوە"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StatBox({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Users }) {
  return (
    <div className="glass rounded-2xl p-3">
      <Icon className="size-5 text-accent mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
