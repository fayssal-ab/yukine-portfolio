import "../globals.css";

export const metadata = {
  title: "Private dashboard · YUKINE",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-ink text-paper" style={{ fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
