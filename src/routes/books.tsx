import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { Download, BookOpen, ExternalLink } from "lucide-react";

const PDF_URL = "https://drive.google.com/file/d/1mw8P2SK22GRu7enYLLe6mEIgIFk44qqC/view?usp=drive_link";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "کتێب — شێنێ" },
      { name: "description", content: "کتێبی فێرکاری شۆفێری" },
    ],
  }),
  component: () => (
    <AuthGuard>
      <BooksPage />
    </AuthGuard>
  ),
});

function BooksPage() {
  return (
    <main className="min-h-screen pb-28">
      <header className="px-4 pt-10 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl gradient-primary flex items-center justify-center glow">
            <BookOpen className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">کتێب</h1>
            <p className="text-xs text-muted-foreground">فێرکاری شۆفێری</p>
          </div>
        </div>
      </header>

      <div className="px-4 max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-6 text-center space-y-6">
          <div className="size-20 mx-auto rounded-full gradient-primary flex items-center justify-center">
            <BookOpen className="size-10 text-primary-foreground" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2">کتێبی فێرکاری شۆفێری</h2>
            <p className="text-muted-foreground text-sm">
              بۆ داگرتنی کتێبەکە کلیک بکە لەسەر دوگمەی خوارەوە
            </p>
          </div>

          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold glow active:scale-95 transition w-full justify-center"
          >
            <Download className="size-5" />
            داگرتنی کتێب
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
