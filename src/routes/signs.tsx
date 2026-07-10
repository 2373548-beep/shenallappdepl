import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { getTrafficSignsFn } from "@/lib/data.functions";
import { useAuth } from "@/lib/auth-context";
import { TrafficCone, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signs")({
  head: () => ({
    meta: [
      { title: "هێماکانی هاتوچۆ — شێنێ" },
      { name: "description", content: "هێماکانی هاتوچۆ بە وەسف و وێنە" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <SignsPage />
    </AuthGuard>
  ),
});

function SignVisual({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <div className="size-32 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
        <img src={imageUrl} alt="" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }
  return <div className="size-32 rounded-xl bg-gray-200" />;
}

function SignsPage() {
  const { token, device } = useAuth();
  const fetchSigns = useServerFn(getTrafficSignsFn);
  const { data, isLoading } = useQuery({
    queryKey: ["signs", token],
    enabled: !!token,
    queryFn: async () => fetchSigns({ data: { token: token!, device } }),
  });

  return (
    <main className="min-h-screen pb-28">
      <header className="px-4 pt-10 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl gradient-primary flex items-center justify-center glow">
            <TrafficCone className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">هێماکانی هاتوچۆ</h1>
            <p className="text-xs text-muted-foreground">فێربە بە وەسف و وێنە</p>
          </div>
        </div>
      </header>

      <div className="px-4 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-4 space-y-3">
            {data?.map((s) => (
              <div key={s.id} className="glass rounded-2xl p-4 flex gap-4 items-start">
                <SignVisual imageUrl={s.image_url ?? null} />
                <div className="flex-1 min-w-0 pt-2">
                  <p className="font-semibold text-sm">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
