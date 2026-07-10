import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { getContacts } from "@/lib/data.functions";
import { useAuth } from "@/lib/auth-context";
import { Phone, Loader2, MessageCircle, Send, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "پەیوەندییەکان — شێنێ" },
      { name: "description", content: "ستافی نوسینگەی شۆفێری شێنێ" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <ContactPage />
    </AuthGuard>
  ),
});

// Convert Arabic-Indic digits to ASCII for tel:/wa.me/etc links
function toAsciiDigits(s: string) {
  return (s ?? "").replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

// Convert local 07xx number to international (+964) for WhatsApp/Viber/Telegram
function intlPhone(phone: string) {
  const digits = toAsciiDigits(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return "964" + digits.slice(1);
  if (digits.startsWith("964")) return digits;
  return digits;
}

function ContactPage() {
  const { token, device } = useAuth();
  const fetchContacts = useServerFn(getContacts);
  const { data, isLoading } = useQuery({
    queryKey: ["contacts"],
    enabled: !!token,
    queryFn: async () => fetchContacts({ data: { token: token!, device } }),
  });

  const manager =
    data?.find((c) => (c.role ?? "").includes("بەڕێوەبەر")) ?? data?.[0];
  const others = data?.filter((c) => c.id !== manager?.id) ?? [];

  return (
    <main className="min-h-screen pb-28">
      {isLoading || !manager ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin">
            <Loader2 className="size-12 text-primary" />
          </div>
        </div>
      ) : (
        <>
          {/* Hero — featured manager */}
          <section className="relative overflow-hidden rounded-b-[2.5rem] gradient-primary text-primary-foreground">
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{
                   backgroundImage:
                     "radial-gradient(circle at 20% 10%, white 0, transparent 40%), radial-gradient(circle at 80% 90%, white 0, transparent 35%)",
                 }} />
            <header className="relative px-5 pt-10 pb-2 flex items-center justify-between max-w-2xl mx-auto">
              <span className="size-9" />
              <h1 className="text-xl font-bold">پەیوەندییەکان</h1>
              <span className="size-9" />
            </header>

            <div className="relative px-5 pt-6 pb-10 max-w-2xl mx-auto flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="size-40 rounded-full p-2 bg-white/30 backdrop-blur">
                  {manager.image_url ? (
                    <img
                      src={manager.image_url}
                      alt={manager.name}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-full rounded-full bg-white/20" />
                  )}
                </div>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-white text-primary px-3 py-1.5 rounded-full shadow whitespace-nowrap">
                  {manager.role}
                </span>
              </div>

              <h2 className="mt-8 text-3xl font-extrabold">{manager.name}</h2>
              <p className="mt-2 text-lg opacity-90" dir="ltr">
                {manager.phone}
              </p>

              {/* Quick channels */}
              <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-sm">
                <ChannelBtn
                  href={`viber://chat?number=%2B${intlPhone(manager.phone)}`}
                  label="ڤایبەر"
                  icon="viber"
                />
                <ChannelBtn
                  href={`https://t.me/+${intlPhone(manager.phone)}`}
                  label="تێلێگرام"
                  icon="telegram"
                />
                <ChannelBtn
                  href={`https://wa.me/${intlPhone(manager.phone)}`}
                  label="واتساپ"
                  icon="whatsapp"
                />
              </div>

              <a
                href={`tel:${toAsciiDigits(manager.phone)}`}
                className="mt-6 w-full max-w-sm rounded-2xl bg-white text-primary font-bold py-4 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition text-lg"
              >
                <Phone className="size-5" />
                پەیوەندی بکە
              </a>
            </div>
          </section>

          {/* Other staff */}
          <section className="px-4 pt-8 max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-muted-foreground mb-4 px-1">
              ئەندامانی تری ستاف
            </h3>
            <div className="space-y-4">
              {others.map((c) => (
                <div
                  key={c.id}
                  className="glass rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-bold text-lg truncate">{c.name}</p>
                    <p className="text-base text-muted-foreground mt-1" dir="ltr">
                      {c.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold gradient-primary text-primary-foreground px-3 py-1.5 rounded-full">
                      {c.role}
                    </span>
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        className="size-16 rounded-full object-cover border-3 border-primary/30"
                      />
                    ) : (
                      <div className="size-16 rounded-full bg-muted" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <BottomNav />
    </main>
  );
}

function ChannelBtn({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "viber" | "telegram" | "whatsapp";
}) {
  // Use user's provided social media icons
  const getIconUrl = (type: string) => {
    switch (type) {
      case "viber":
        return "https://i.postimg.cc/B6KqS98m/images-(33).jpg";
      case "whatsapp":
        return "https://i.postimg.cc/8561pQFt/images-(34).jpg";
      case "telegram":
        return "https://i.postimg.cc/762xH8CB/images-(35).jpg";
      default:
        return "";
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2"
    >
      <span className="size-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center active:scale-95 transition">
        <img src={getIconUrl(icon)} alt={label} className="size-10 rounded-xl object-contain" />
      </span>
      <span className="text-sm font-medium opacity-90">{label}</span>
    </a>
  );
}
