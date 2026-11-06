"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signIn("github", { redirectTo: "/admin" });
      }}
      className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-paper px-6 py-3 font-semibold text-ink transition-colors hover:bg-brand disabled:opacity-60"
    >
      <span aria-hidden>◉</span>
      {loading ? "Redirecting…" : "Continue with GitHub"}
    </button>
  );
}
