import type { Viewport } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";

export const metadata = {
  title: "Private dashboard · YUKINE",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0a0712" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body className="min-h-screen bg-ink text-paper">
        <div className="grain" aria-hidden />
        {/* brand glow, same mood as the public site */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-brand/15 blur-[140px]" />
          <div className="absolute -bottom-40 right-0 h-[480px] w-[480px] rounded-full bg-brand-2/10 blur-[140px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
