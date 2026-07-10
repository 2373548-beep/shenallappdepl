import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">پەڕە نەدۆزرایەوە</h2>
        <p className="mt-2 text-sm text-muted-foreground">ئەو پەڕەیە بوونی نییە.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-2xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow">
          گەڕانەوە بۆ سەرەکی
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">هەڵە ڕوویدا</h1>
        <p className="mt-2 text-sm text-muted-foreground">شتێک هەڵە چووە. تکایە دووبارە هەوڵ بدەرەوە.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-2xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            دووبارە هەوڵ بدە
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "نوسینگەی شۆفێری شێنێ" },
      { name: "description", content: "ئەپڵیکەیشنی فێرکاری و تاقیکردنەوەی شۆفێری" },
      { name: "theme-color", content: "#0a1530" },
      { property: "og:title", content: "نوسینگەی شۆفێری شێنێ" },
      { name: "twitter:title", content: "نوسینگەی شۆفێری شێنێ" },
      { property: "og:description", content: "ئەپڵیکەیشنی فێرکاری و تاقیکردنەوەی شۆفێری" },
      { name: "twitter:description", content: "ئەپڵیکەیشنی فێرکاری و تاقیکردنەوەی شۆفێری" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b4483b22-c1f8-47f3-85d6-0b090a548afb/id-preview-6148495c--4f67be06-4d9e-4798-8d5e-007434f4dc80.lovable.app-1781644066556.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b4483b22-c1f8-47f3-85d6-0b090a548afb/id-preview-6148495c--4f67be06-4d9e-4798-8d5e-007434f4dc80.lovable.app-1781644066556.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ku" dir="rtl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" theme="dark" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
