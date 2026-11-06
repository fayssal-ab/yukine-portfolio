import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { isSameOrigin, requireAdmin } from "@/lib/admin-api";
import { describeDbError, ensurePortalTables, execute, rows } from "@/lib/portal-db";

type AdminItem = RowDataPacket & {
  id: number;
  kind: "task" | "note";
  title: string;
  content: string;
  is_done: number;
  created_at: Date;
};

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const kind = new URL(request.url).searchParams.get("kind");
  if (kind !== null && kind !== "task" && kind !== "note") {
    return NextResponse.json({ error: "Choose tasks or notes." }, { status: 400 });
  }

  try {
    await ensurePortalTables();
    const items = await rows<AdminItem>(
      `SELECT id, kind, title, content, is_done, created_at
       FROM portfolio_admin_items
       ${kind ? "WHERE kind = ?" : ""}
       ORDER BY is_done ASC, created_at DESC
       LIMIT 200`,
      kind ? [kind] : [],
    );
    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        content: item.content,
        done: Boolean(item.is_done),
        createdAt: item.created_at,
      })),
    });
  } catch (error) {
    console.error("[admin/items] failed to load items:", error);
    return NextResponse.json({ error: `Could not load dashboard items. ${describeDbError(error)}` }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const kind = body.kind;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (
    (kind !== "task" && kind !== "note") ||
    title.length < 2 ||
    title.length > 160 ||
    content.length > 4000 ||
    (kind === "note" && content.length < 1)
  ) {
    return NextResponse.json({ error: "Check the title and content and try again." }, { status: 400 });
  }

  try {
    await ensurePortalTables();
    const result = await execute(
      "INSERT INTO portfolio_admin_items (kind, title, content) VALUES (?, ?, ?)",
      [kind, title, content],
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("[admin/items] failed to create item:", error);
    return NextResponse.json({ error: `Could not save this item. ${describeDbError(error)}` }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid item." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const content = typeof body.content === "string" ? body.content.trim() : undefined;
  if (title !== undefined && (title.length < 2 || title.length > 160)) {
    return NextResponse.json({ error: "Titles must be 2–160 characters." }, { status: 400 });
  }
  if (content !== undefined && content.length > 4000) {
    return NextResponse.json({ error: "Content must be 4,000 characters or fewer." }, { status: 400 });
  }

  try {
    await ensurePortalTables();
    let result;
    if (typeof body.done === "boolean") {
      result = await execute(
        "UPDATE portfolio_admin_items SET is_done = ? WHERE id = ? AND kind = 'task'",
        [body.done ? 1 : 0, id],
      );
    } else if (title !== undefined || content !== undefined) {
      const updates = [
        ...(title !== undefined ? ["title = ?"] : []),
        ...(content !== undefined ? ["content = ?"] : []),
      ];
      const values = [
        ...(title !== undefined ? [title] : []),
        ...(content !== undefined ? [content] : []),
        id,
      ];
      result = await execute(
        `UPDATE portfolio_admin_items SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    } else {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    if (!result.affectedRows) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/items] failed to update item:", error);
    return NextResponse.json({ error: `Could not update this item. ${describeDbError(error)}` }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid item." }, { status: 400 });
  }

  try {
    await ensurePortalTables();
    const result = await execute("DELETE FROM portfolio_admin_items WHERE id = ?", [id]);
    if (!result.affectedRows) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/items] failed to delete item:", error);
    return NextResponse.json({ error: `Could not delete this item. ${describeDbError(error)}` }, { status: 503 });
  }
}
