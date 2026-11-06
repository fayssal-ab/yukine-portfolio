import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginButton from "./login-button";

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Private area</p>
      <h1 className="mt-4 font-display text-4xl font-extrabold">YUKINE dashboard</h1>
      <p className="mt-3 text-dim">Sign in with the authorized GitHub account to continue.</p>
      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
          This GitHub account is not authorized to access the dashboard.
        </p>
      )}
      <LoginButton />
      <p className="mt-6 text-xs text-dim">This private sign-in page is not linked from the public website.</p>
    </main>
  );
}
