import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { Mascot3D } from "@/components/three/Lazy3D";
import LoginButton from "./login-button";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  AccessDenied: "This GitHub account is not authorized to open the dashboard.",
  Configuration: "Sign-in is misconfigured on the server: check AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET.",
  Verification: "The sign-in link expired. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.githubLogin?.toLowerCase() === process.env.ADMIN_GITHUB_USERNAME?.trim().toLowerCase()) {
    redirect("/admin");
  }
  const { error } = await searchParams;
  const message = error ? (errors[error] ?? "GitHub sign-in did not complete. Please try again.") : null;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-[1fr_1fr]">
      <section>
        <a href="/" aria-label="Back to the website" className="inline-block">
          <Logo size={40} />
        </a>
        <p className="mt-14 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-dim">
          <span className="text-brand">00</span>
          <span className="h-px w-10 bg-line" />
          Private area
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]">
          Studio <br />
          <span className="text-gradient">dashboard</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-dim">
          Stats, tasks and notes for the YUKINE site. Sign in with the authorized GitHub account to continue.
        </p>
        {message && (
          <p role="alert" className="mt-8 max-w-md rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {message}
          </p>
        )}
        <LoginButton />
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-dim/70">Not linked from the public website</p>
      </section>
      <div className="relative hidden h-[560px] md:block" aria-hidden>
        <div className="absolute inset-10 rounded-full bg-brand/10 blur-3xl" />
        <Mascot3D pose="read" />
      </div>
    </main>
  );
}
