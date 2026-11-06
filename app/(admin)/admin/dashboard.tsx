"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import Logo from "@/components/Logo";
import { spotMove } from "@/components/ui";

type Kind = "task" | "note";
type Item = { id: number; kind: Kind; title: string; content: string; done: boolean; createdAt: string };
type Stats = {
  allTime: { pageViews: number; contactRequests: number };
  lastSevenDays: { pageViews: number; contactRequests: number };
  topPages: { path: string; views: number }[];
  daily: { day: string; views: number }[];
};

const ease = [0.22, 1, 0.36, 1] as const;

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, { cache: "no-store", ...init });
  } catch {
    throw new Error("Network error: check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Your session expired. Redirecting to sign in…");
  }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const fmt = new Intl.NumberFormat("en");
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AdminDashboard({ username, name, avatar }: { username: string; name: string | null; avatar: string | null }) {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [itemsError, setItemsError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await api<{ items: Item[] }>("/api/admin/items");
      setItems(data.items);
      setItemsError("");
    } catch (e) {
      setItemsError(e instanceof Error ? e.message : "Could not load dashboard items.");
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api<Stats>("/api/admin/stats"));
      setStatsError("");
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "Could not load statistics.");
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadItems(), loadStats()]);
    setRefreshing(false);
    setLoading(false);
  }, [loadItems, loadStats]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Runs a mutation with an optimistic local update, rolling back if the server refuses. */
  const mutate = useCallback(
    async (optimistic: (list: Item[]) => Item[], request: () => Promise<unknown>) => {
      setActionError("");
      const previous = items;
      setItems(optimistic(previous));
      try {
        await request();
        await loadItems();
      } catch (e) {
        setItems(previous);
        setActionError(e instanceof Error ? e.message : "Something went wrong.");
      }
    },
    [items, loadItems],
  );

  const create = async (kind: Kind, title: string, content: string) => {
    setActionError("");
    try {
      await api("/api/admin/items", json("POST", { kind, title, content }));
      await loadItems();
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not save this item.");
      return false;
    }
  };

  const toggle = (item: Item) =>
    mutate(
      (list) => list.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
      () => api("/api/admin/items", json("PATCH", { id: item.id, done: !item.done })),
    );

  const edit = (item: Item, title: string, content: string) =>
    mutate(
      (list) => list.map((i) => (i.id === item.id ? { ...i, title, content } : i)),
      () => api("/api/admin/items", json("PATCH", { id: item.id, title, content })),
    );

  const remove = (item: Item) =>
    mutate(
      (list) => list.filter((i) => i.id !== item.id),
      () => api(`/api/admin/items?id=${item.id}`, { method: "DELETE" }),
    );

  const statsFailed = !!statsError && !stats;
  const tasks = useMemo(() => items.filter((i) => i.kind === "task").sort((a, b) => Number(a.done) - Number(b.done)), [items]);
  const notes = useMemo(() => items.filter((i) => i.kind === "note"), [items]);
  const openTasks = tasks.filter((t) => !t.done).length;
  // greeting uses the visitor's clock, so it is set after hydration
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16">
      {/* top bar */}
      <header className="sticky top-0 z-40 -mx-5 flex items-center justify-between gap-4 border-b border-line/70 bg-ink/75 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <a href="/" aria-label="Open the public website">
            <Logo size={32} />
          </a>
          <span className="hidden rounded-full border border-brand/40 bg-brand/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-brand sm:inline">
            Private
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-dim transition-colors hover:border-paper/40 hover:text-paper sm:inline-flex"
          >
            View site ↗
          </a>
          <span className="flex h-10 items-center gap-2 rounded-full border border-line bg-ink-2/70 pe-4 ps-1">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand font-bold text-on-brand">{username[0]?.toUpperCase()}</span>
            )}
            <span className="hidden text-sm font-semibold sm:inline">@{username}</span>
          </span>
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: "/login" })}
            className="h-10 rounded-full bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-on-brand"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* heading */}
      <section className="flex flex-wrap items-end justify-between gap-6 pb-10 pt-14 md:pt-20">
        <div>
          <Eyebrow n="01">Overview</Eyebrow>
          <h1 className="font-display text-[clamp(2.2rem,6vw,4.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
            {greeting}, <br />
            <span className="text-gradient">{name?.split(" ")[0] || username}</span>
          </h1>
          <p className="mt-5 text-dim">
            {loading ? "Loading your studio…" : `${openTasks} open ${openTasks === 1 ? "task" : "tasks"} · ${notes.length} ${notes.length === 1 ? "note" : "notes"} · ${dateFmt.format(new Date())}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-ink-2/70 px-5 text-sm font-semibold transition-colors hover:border-brand disabled:opacity-60"
        >
          <motion.span aria-hidden animate={{ rotate: refreshing ? 360 : 0 }} transition={refreshing ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0 }}>
            ↻
          </motion.span>
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </section>

      <AnimatePresence>
        {actionError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert onClose={() => setActionError("")}>{actionError}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* stats */}
      {statsError && <Alert onRetry={() => void loadStats()}>{statsError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views" period="Last 7 days" value={stats?.lastSevenDays.pageViews} failed={statsFailed} accent />
        <StatCard label="Requests" period="Last 7 days" value={stats?.lastSevenDays.contactRequests} failed={statsFailed} />
        <StatCard label="Views" period="All time" value={stats?.allTime.pageViews} failed={statsFailed} />
        <StatCard label="Requests" period="All time" value={stats?.allTime.contactRequests} failed={statsFailed} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardTitle title="Page views" hint="Last 14 days · UTC" />
          <ViewsChart data={stats?.daily} dim={refreshing} failed={statsFailed} />
        </Card>
        <Card>
          <CardTitle title="Top pages" hint="Last 7 days" />
          <TopPages pages={stats?.topPages} loading={loading} failed={statsFailed} />
        </Card>
      </div>

      {/* workspace */}
      <section className="mt-20">
        <Eyebrow n="02">Workspace</Eyebrow>
        <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
          Tasks <span className="text-outline">&amp; notes</span>
        </h2>
        {itemsError && (
          <div className="mt-8">
            <Alert onRetry={() => void loadItems()}>{itemsError}</Alert>
          </div>
        )}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Board
            kind="task"
            title="To-do"
            count={openTasks}
            items={tasks}
            loading={loading}
            onCreate={create}
            onToggle={toggle}
            onEdit={edit}
            onDelete={remove}
          />
          <Board kind="note" title="Notes" count={notes.length} items={notes} loading={loading} onCreate={create} onEdit={edit} onDelete={remove} />
        </div>
      </section>

      <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-dim/80">
        <span>Analytics never store IP addresses or query strings</span>
        <span>YUKINE · Studio</span>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-dim">
      <span className="text-brand">{n}</span>
      <span className="h-px w-10 bg-line" />
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div onPointerMove={spotMove} className={`spot rounded-3xl border border-line bg-ink-2/80 p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {right ?? (hint && <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">{hint}</span>)}
    </div>
  );
}

function Alert({ children, onRetry, onClose }: { children: ReactNode; onRetry?: () => void; onClose?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
      <span className="flex gap-2">
        <span aria-hidden>⚠</span>
        <span>{children}</span>
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 rounded-full border border-red-300/40 px-3 py-1 text-xs font-semibold hover:bg-red-400/20">
          Try again
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 px-2 text-red-200 hover:text-paper">
          ✕
        </button>
      )}
    </div>
  );
}

function StatCard({ label, period, value, failed, accent = false }: { label: string; period: string; value?: number; failed: boolean; accent?: boolean }) {
  return (
    <Card>
      <p className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
        <span>{label}</span>
        <span>{period}</span>
      </p>
      {value === undefined ? (
        failed ? <p className="mt-5 font-display text-5xl font-extrabold text-dim/40">—</p> : <span className="mt-6 block h-12 w-24 animate-pulse rounded-lg bg-ink-3" />
      ) : (
        <p className={`mt-5 font-display text-5xl font-extrabold tracking-tight ${accent ? "text-gradient" : ""}`}>{fmt.format(value)}</p>
      )}
    </Card>
  );
}

/** Single-series bar chart: brand bars on the card surface, hover/focus tooltip, table for screen readers. */
function ViewsChart({ data, dim, failed }: { data?: Stats["daily"]; dim: boolean; failed: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  if (!data && failed) return <Unavailable />;
  if (!data) return <div className="mt-6 h-52 animate-pulse rounded-2xl bg-ink-3/60" />;
  const max = Math.max(1, ...data.map((d) => d.views));
  const total = data.reduce((sum, d) => sum + d.views, 0);
  const shown = active ?? data.length - 1;

  return (
    <div className={`mt-4 transition-opacity ${dim ? "opacity-60" : ""}`}>
      <p className="text-sm text-dim">
        <span className="font-display text-2xl font-bold text-paper">{fmt.format(data[shown].views)}</span>{" "}
        {data[shown].views === 1 ? "view" : "views"} on {dayFmt.format(new Date(data[shown].day))} · {fmt.format(total)} in 14 days
      </p>
      <div className="relative mt-5">
        {/* recessive gridlines: max and half */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line/60" />
          <span className="absolute -top-2.5 end-0 bg-ink-2 ps-1 font-mono text-[10px] text-dim">{fmt.format(max)}</span>
        </div>
        <div className="flex h-40 items-end gap-[2px] border-b border-line" onPointerLeave={() => setActive(null)}>
          {data.map((d, i) => (
            <button
              key={d.day}
              type="button"
              aria-label={`${dayFmt.format(new Date(d.day))}: ${d.views} views`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="group relative flex h-full flex-1 items-end focus-visible:outline-offset-0"
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${active === i ? "bg-brand-2" : "bg-brand"}`}
                style={{ height: d.views ? `${Math.max(3, (d.views / max) * 100)}%` : "2px", opacity: d.views ? 1 : 0.35 }}
              />
            </button>
          ))}
        </div>
        <div aria-hidden className="mt-2 flex justify-between font-mono text-[10px] text-dim">
          <span>{dayFmt.format(new Date(data[0].day))}</span>
          <span>{dayFmt.format(new Date(data[7].day))}</span>
          <span>Today</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Page views per day, last 14 days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPages({ pages, loading, failed }: { pages?: Stats["topPages"]; loading: boolean; failed: boolean }) {
  if (!pages && failed) return <Unavailable />;
  if (!pages)
    return (
      <div className="mt-6 grid gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-8 animate-pulse rounded-lg bg-ink-3/60" />
        ))}
      </div>
    );
  if (!pages.length) return <p className="mt-6 text-sm text-dim">{loading ? "Loading…" : "No page views recorded this week yet."}</p>;
  const max = pages[0].views;
  return (
    <ol className="mt-5 grid gap-2.5">
      {pages.map((p, i) => (
        <li key={p.path} className="relative overflow-hidden rounded-xl border border-line/60 px-3 py-2">
          <span aria-hidden className="absolute inset-y-0 start-0 bg-brand/15" style={{ width: `${(p.views / max) * 100}%` }} />
          <span className="relative flex items-center justify-between gap-4 text-sm">
            <span className="flex min-w-0 items-center gap-3">
              <span className="font-mono text-[11px] text-brand">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate" title={p.path}>
                {p.path}
              </span>
            </span>
            <span className="font-mono text-paper">{fmt.format(p.views)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Unavailable() {
  return <p className="mt-6 grid h-40 place-items-center rounded-2xl border border-dashed border-line text-sm text-dim">Unavailable until the database connects.</p>;
}

/* ---------------------------------------------------------------- tasks & notes */

type BoardProps = {
  kind: Kind;
  title: string;
  count: number;
  items: Item[];
  loading: boolean;
  onCreate: (kind: Kind, title: string, content: string) => Promise<boolean>;
  onToggle?: (item: Item) => void;
  onEdit: (item: Item, title: string, content: string) => void;
  onDelete: (item: Item) => void;
};

function Board({ kind, title, count, items, loading, onCreate, onToggle, onEdit, onDelete }: BoardProps) {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (await onCreate(kind, draftTitle.trim(), draftContent.trim())) {
      setDraftTitle("");
      setDraftContent("");
      setExpanded(false);
    }
    setSaving(false);
  };

  return (
    <Card className="flex flex-col">
      <CardTitle
        title={title}
        right={<span className="rounded-full bg-ink-3 px-2.5 py-0.5 font-mono text-xs text-dim">{count}{kind === "task" ? " open" : ""}</span>}
      />

      <form onSubmit={submit} className="mt-5 rounded-2xl border border-line bg-ink/60 p-2 focus-within:border-brand/60">
        <div className="flex items-center gap-2">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onFocus={() => setExpanded(true)}
            required
            minLength={2}
            maxLength={160}
            placeholder={kind === "task" ? "Add a task…" : "New note title…"}
            aria-label={kind === "task" ? "New task" : "New note title"}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-paper outline-none placeholder:text-dim/70"
          />
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {(expanded || kind === "note") && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                required={kind === "note"}
                maxLength={4000}
                rows={kind === "note" ? 3 : 2}
                placeholder={kind === "task" ? "Details (optional)" : "Write the note…"}
                aria-label={kind === "task" ? "Task details" : "Note content"}
                className="mt-1 w-full resize-y border-t border-line/60 bg-transparent px-3 py-2 text-sm text-paper outline-none placeholder:text-dim/70"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <ul className="mt-4 grid content-start gap-2.5">
        {loading && !items.length ? (
          [0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-2xl bg-ink-3/50" />)
        ) : items.length ? (
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease }}>
                <Row item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
              </motion.li>
            ))}
          </AnimatePresence>
        ) : (
          <li className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-dim">
            {kind === "task" ? "Nothing to do. Enjoy it." : "No notes yet."}
          </li>
        )}
      </ul>
    </Card>
  );
}

function Row({ item, onToggle, onEdit, onDelete }: { item: Item; onToggle?: (item: Item) => void; onEdit: (item: Item, title: string, content: string) => void; onDelete: (item: Item) => void }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  if (editing)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEdit(item, title.trim(), content.trim());
          setEditing(false);
        }}
        className="rounded-2xl border border-brand/50 bg-ink/70 p-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={2}
          maxLength={160}
          aria-label="Title"
          autoFocus
          className="w-full rounded-lg bg-ink-3/60 px-3 py-2 font-semibold text-paper outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required={item.kind === "note"}
          maxLength={4000}
          rows={3}
          aria-label="Content"
          className="mt-2 w-full resize-y rounded-lg bg-ink-3/60 px-3 py-2 text-sm text-paper outline-none"
        />
        <div className="mt-2 flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setTitle(item.title);
              setContent(item.content);
              setEditing(false);
            }}
            className="rounded-full px-4 py-1.5 text-dim hover:text-paper"
          >
            Cancel
          </button>
          <button type="submit" className="rounded-full bg-brand px-4 py-1.5 font-semibold text-on-brand">
            Save
          </button>
        </div>
      </form>
    );

  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-line/70 bg-ink/40 p-3.5 transition-colors hover:border-line hover:bg-ink/70">
      {onToggle && (
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          aria-label={`Mark “${item.title}” as ${item.done ? "not done" : "done"}`}
          onClick={() => onToggle(item)}
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${item.done ? "border-brand bg-brand text-on-brand" : "border-dim/60 hover:border-brand"}`}
        >
          {item.done && (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="m3 8.5 3 3 7-7" />
            </svg>
          )}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-semibold leading-snug ${item.done ? "text-dim line-through decoration-brand/60" : ""}`}>{item.title}</p>
        {item.content && <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-dim">{item.content}</p>}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim/70">{dateFmt.format(new Date(item.createdAt))}</p>
      </div>
      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <IconButton label="Edit" onClick={() => setEditing(true)}>
          <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
        </IconButton>
        <IconButton label={confirming ? "Click again to delete" : "Delete"} danger={confirming} onClick={() => (confirming ? onDelete(item) : setConfirming(true))}>
          {confirming ? <path d="m5 12 4 4 10-10" /> : <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />}
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${danger ? "bg-red-400/20 text-red-200" : "text-dim hover:bg-ink-3 hover:text-paper"}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
