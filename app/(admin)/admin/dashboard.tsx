"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";

type Item = {
  id: number;
  kind: "task" | "note";
  title: string;
  content: string;
  done: boolean;
  createdAt: string;
};

type Stats = {
  allTime: { pageViews: number; contactRequests: number };
  lastSevenDays: { pageViews: number; contactRequests: number };
  topPages: { path: string; views: number }[];
};

async function responseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export default function AdminDashboard({ username }: { username: string }) {
  const [tasks, setTasks] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [kind, setKind] = useState<"task" | "note">("task");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const [taskData, noteData, statData] = await Promise.all([
        fetch("/api/admin/items?kind=task").then(responseJson<{ items: Item[] }>),
        fetch("/api/admin/items?kind=note").then(responseJson<{ items: Item[] }>),
        fetch("/api/admin/stats").then(responseJson<Stats>),
      ]);
      setTasks(taskData.items);
      setNotes(noteData.items);
      setStats(statData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, content }),
      });
      await responseJson(result);
      setTitle("");
      setContent("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this item.");
    }
  }

  async function updateItem(item: Item, changes: { done?: boolean; title?: string; content?: string }) {
    setError("");
    try {
      await responseJson(
        await fetch("/api/admin/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, ...changes }),
        }),
      );
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this item.");
    }
  }

  async function deleteItem(item: Item) {
    setError("");
    try {
      await responseJson(
        await fetch(`/api/admin/items?id=${item.id}`, { method: "DELETE" }),
      );
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this item.");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 md:py-16">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Private admin</p>
          <h1 className="mt-3 text-4xl font-extrabold">Dashboard</h1>
          <p className="mt-2 text-sm text-dim">Signed in as @{username}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/login" })}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-brand"
        >
          Sign out
        </button>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Portfolio stats</h2>
            <p className="mt-1 text-sm text-dim">Anonymous page views and successfully delivered contact requests.</p>
          </div>
          <button type="button" onClick={() => void load()} className="text-sm text-dim underline underline-offset-4 hover:text-paper">
            Refresh
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Views · 7 days" value={stats?.lastSevenDays.pageViews} />
          <StatCard label="Requests · 7 days" value={stats?.lastSevenDays.contactRequests} />
          <StatCard label="Views · all time" value={stats?.allTime.pageViews} />
          <StatCard label="Requests · all time" value={stats?.allTime.contactRequests} />
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-ink-2 p-5">
          <h3 className="font-semibold">Most viewed pages · last 7 days</h3>
          {stats?.topPages.length ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {stats.topPages.map((page) => (
                <li key={page.path} className="flex justify-between gap-4 text-sm">
                  <span className="break-all text-dim">{page.path}</span>
                  <span className="font-mono">{page.views}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-dim">{loading ? "Loading…" : "No page views recorded yet."}</p>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form onSubmit={createItem} className="h-fit rounded-2xl border border-line bg-ink-2 p-5">
          <h2 className="text-xl font-bold">Quick add</h2>
          <label className="mt-5 block text-sm text-dim" htmlFor="item-kind">Type</label>
          <select
            id="item-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as "task" | "note")}
            className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-paper"
          >
            <option value="task">To-do task</option>
            <option value="note">Note</option>
          </select>
          <label className="mt-4 block text-sm text-dim" htmlFor="item-title">Title</label>
          <input
            id="item-title"
            required
            minLength={2}
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-paper"
          />
          <label className="mt-4 block text-sm text-dim" htmlFor="item-content">
            {kind === "task" ? "Details (optional)" : "Note"}
          </label>
          <textarea
            id="item-content"
            maxLength={4000}
            required={kind === "note"}
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-ink px-3 py-3 text-paper"
          />
          <button type="submit" className="mt-5 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand">
            Add {kind}
          </button>
        </form>

        <div className="grid content-start gap-8">
          <ItemList title="To-do" items={tasks} onDone={updateItem} onDelete={deleteItem} />
          <ItemList title="Notes" items={notes} onEdit={updateItem} onDelete={deleteItem} />
        </div>
      </section>
      <p className="mt-10 border-t border-line pt-5 text-xs text-dim">
        Analytics do not store visitor IP addresses or query strings.
      </p>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2 p-5">
      <p className="text-sm text-dim">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold">{value ?? "—"}</p>
    </div>
  );
}

function ItemList({
  title,
  items,
  onDone,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Item[];
  onDone?: (item: Item, changes: { done: boolean }) => void;
  onEdit?: (item: Item, changes: { title: string; content: string }) => void;
  onDelete: (item: Item) => void;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {items.length ? items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-ink-2 p-4">
            <div className="flex items-start gap-3">
              {onDone && (
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) => onDone(item, { done: event.target.checked })}
                  aria-label={`Mark ${item.title} ${item.done ? "not done" : "done"}`}
                  className="mt-1 h-4 w-4 accent-fuchsia-500"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold ${item.done ? "text-dim line-through" : ""}`}>{item.title}</h3>
                {item.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-dim">{item.content}</p>}
                <p className="mt-3 text-xs text-dim">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextTitle = window.prompt("Edit note title", item.title);
                      if (nextTitle === null) return;
                      const nextContent = window.prompt("Edit note", item.content);
                      if (nextContent !== null) onEdit(item, { title: nextTitle, content: nextContent });
                    }}
                    className="text-dim underline underline-offset-4 hover:text-paper"
                  >
                    Edit
                  </button>
                )}
                <button type="button" onClick={() => onDelete(item)} className="text-red-300 underline underline-offset-4">
                  Delete
                </button>
              </div>
            </div>
          </li>
        )) : (
          <li className="rounded-2xl border border-dashed border-line p-5 text-sm text-dim">
            {loadingMessage(title)}
          </li>
        )}
      </ul>
    </section>
  );
}

function loadingMessage(title: string) {
  return title === "To-do" ? "No tasks yet." : "No notes yet.";
}
