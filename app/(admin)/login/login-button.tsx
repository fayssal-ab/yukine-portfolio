"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void signIn("github", { redirectTo: "/admin" }).catch(() => setLoading(false));
      }}
      className="group mt-10 inline-flex items-center gap-3 rounded-full bg-paper px-7 py-4 font-semibold text-ink transition-colors hover:bg-brand hover:text-on-brand disabled:cursor-wait disabled:opacity-70"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
      {loading ? "Redirecting to GitHub…" : "Continue with GitHub"}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
    </button>
  );
}
